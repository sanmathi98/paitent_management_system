import hashlib
import hmac
from decimal import Decimal
import razorpay
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from rest_framework.exceptions import ValidationError
from patients.models import Patient
from patients.serializers import PatientSerializer
from .models import Bill, Payment, PaymentStatus
from .serializers import BillSerializer


def get_dashboard_summary() -> dict:
    total_patients = Patient.objects.count()
    recent_patients = Patient.objects.order_by("-created_at")[:5]
    total_bills = Bill.objects.count()

    paid_sum = (
        Bill.objects.filter(payment_status=PaymentStatus.PAID).aggregate(
            total=Sum("total_amount")
        )["total"]
        or Decimal("0.00")
    )
    pending_sum = (
        Bill.objects.filter(
            payment_status__in=[PaymentStatus.PENDING, PaymentStatus.FAILED]
        ).aggregate(total=Sum("total_amount"))["total"]
        or Decimal("0.00")
    )
    recent_bills = Bill.objects.select_related("patient").order_by("-created_at")[:5]

    return {
        "total_patients": total_patients,
        "recently_added_patients": PatientSerializer(recent_patients, many=True).data,
        "total_bills": total_bills,
        "total_paid_amount": float(paid_sum),
        "total_pending_amount": float(pending_sum),
        "recent_bills": BillSerializer(recent_bills, many=True).data,
    }


def _get_razorpay_client() -> razorpay.Client:
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if not key_id or not key_secret:
        raise ValidationError(
            "Razorpay credentials are not configured on the backend server."
        )
    return razorpay.Client(auth=(key_id, key_secret))


@transaction.atomic
def create_razorpay_order_for_bill(bill: Bill) -> dict:
    if bill.payment_status == PaymentStatus.PAID:
        raise ValidationError("This bill has already been paid.")
    if bill.total_amount <= Decimal("0.00"):
        raise ValidationError("Invalid bill amount for payment.")

    amount_paise = int((bill.total_amount * 100).quantize(Decimal("1")))
    client = _get_razorpay_client()

    order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"bill_{bill.id}",
            "payment_capture": 1,
        }
    )

    Payment.objects.create(
        bill=bill,
        razorpay_order_id=order["id"],
        amount=bill.total_amount,
        payment_status=PaymentStatus.PENDING,
    )

    return {
        "order_id": order["id"],
        "amount": float(bill.total_amount),
        "amount_paise": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
        "bill_id": bill.id,
        "patient_name": bill.patient.name,
        "patient_email": bill.patient.email,
        "patient_phone": bill.patient.phone_number,
        "description": bill.description,
    }


def compute_razorpay_signature(order_id: str, payment_id: str, secret: str) -> str:
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


@transaction.atomic
def verify_and_complete_payment(
    bill: Bill,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> Payment:
    payment = Payment.objects.select_for_update().filter(
        bill=bill,
        razorpay_order_id=razorpay_order_id,
    ).first()

    if not payment:
        raise ValidationError("Matching Razorpay order record was not found.")

    secret = settings.RAZORPAY_KEY_SECRET
    if not secret:
        raise ValidationError("Razorpay secret key is missing on the server.")

    expected_signature = compute_razorpay_signature(
        razorpay_order_id, razorpay_payment_id, secret
    )

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.payment_status = PaymentStatus.FAILED
        payment.failure_reason = "Invalid Razorpay payment signature."
        payment.save()

        bill.payment_status = PaymentStatus.FAILED
        bill.save(update_fields=["payment_status", "updated_at"])
        raise ValidationError("Invalid Razorpay payment signature.")

    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.payment_status = PaymentStatus.PAID
    payment.failure_reason = None
    payment.save()

    bill.payment_status = PaymentStatus.PAID
    bill.save(update_fields=["payment_status", "updated_at"])
    return payment


@transaction.atomic
def mark_payment_failed_or_cancelled(
    bill: Bill,
    razorpay_order_id: str,
    payment_status: str,
    failure_reason: str,
) -> Payment:
    payment = Payment.objects.select_for_update().filter(
        bill=bill,
        razorpay_order_id=razorpay_order_id,
    ).first()
    if not payment:
        raise ValidationError("Matching payment order record was not found.")

    payment.payment_status = payment_status
    payment.failure_reason = failure_reason
    payment.save()

    if bill.payment_status != PaymentStatus.PAID:
        bill.payment_status = payment_status
        bill.save(update_fields=["payment_status", "updated_at"])

    return payment
