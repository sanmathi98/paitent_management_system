from decimal import Decimal
from django.test import TestCase, override_settings
from rest_framework.exceptions import ValidationError
from patients.models import Patient
from .models import Bill, Payment, PaymentStatus
from .services import compute_razorpay_signature, verify_and_complete_payment


class BillingAndPaymentTests(TestCase):
    def setUp(self):
        self.patient = Patient.objects.create(
            name="Test Patient",
            age=35,
            gender="Male",
            phone_number="+91 9876543210",
            email="test.patient@example.com",
            address="123 Health Ave",
        )
        self.bill = Bill.objects.create(
            patient=self.patient,
            description="Cardiology Consultation",
            amount=Decimal("1000.00"),
            tax=Decimal("180.00"),
            total_amount=Decimal("1180.00"),
        )
        self.payment = Payment.objects.create(
            bill=self.bill,
            razorpay_order_id="order_Test12345",
            amount=Decimal("1180.00"),
            payment_status=PaymentStatus.PENDING,
        )

    def test_bill_total_calculation(self):
        self.assertEqual(self.bill.total_amount, Decimal("1180.00"))
        self.assertEqual(self.bill.payment_status, PaymentStatus.PENDING)

    @override_settings(RAZORPAY_KEY_SECRET="test_secret_for_unit_tests")
    def test_verify_valid_razorpay_signature(self):
        valid_sig = compute_razorpay_signature(
            "order_Test12345", "pay_Test98765", "test_secret_for_unit_tests"
        )
        updated_payment = verify_and_complete_payment(
            bill=self.bill,
            razorpay_order_id="order_Test12345",
            razorpay_payment_id="pay_Test98765",
            razorpay_signature=valid_sig,
        )
        self.bill.refresh_from_db()
        self.assertEqual(updated_payment.payment_status, PaymentStatus.PAID)
        self.assertEqual(self.bill.payment_status, PaymentStatus.PAID)

    @override_settings(RAZORPAY_KEY_SECRET="test_secret_for_unit_tests")
    def test_reject_invalid_razorpay_signature(self):
        with self.assertRaises(ValidationError):
            verify_and_complete_payment(
                bill=self.bill,
                razorpay_order_id="order_Test12345",
                razorpay_payment_id="pay_Test98765",
                razorpay_signature="tampered_signature",
            )
        self.bill.refresh_from_db()
        self.payment.refresh_from_db()
        self.assertEqual(self.bill.payment_status, PaymentStatus.FAILED)
        self.assertEqual(self.payment.payment_status, PaymentStatus.FAILED)
