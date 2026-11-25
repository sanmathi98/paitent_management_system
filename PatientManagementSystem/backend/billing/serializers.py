from decimal import Decimal
from rest_framework import serializers
from patients.models import Patient
from .models import Bill, Payment, PaymentStatus


class BillSerializer(serializers.ModelSerializer):
    patient_id = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        source="patient",
    )
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    patient_email = serializers.EmailField(source="patient.email", read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False, required=False, default=Decimal("0.00"))
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False, read_only=True)

    class Meta:
        model = Bill
        fields = (
            "id",
            "patient_id",
            "patient_name",
            "patient_email",
            "description",
            "amount",
            "tax",
            "total_amount",
            "payment_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "total_amount", "created_at", "updated_at")

    def validate_description(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Service description is required.")
        return cleaned

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Bill amount must be greater than zero.")
        return value

    def validate_tax(self, value: Decimal) -> Decimal:
        if value < Decimal("0.00"):
            raise serializers.ValidationError("Tax cannot be negative.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    bill_id = serializers.IntegerField(source="bill.id", read_only=True)
    patient_name = serializers.CharField(source="bill.patient.name", read_only=True)
    bill_description = serializers.CharField(source="bill.description", read_only=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = Payment
        fields = (
            "id",
            "bill_id",
            "patient_name",
            "bill_description",
            "razorpay_order_id",
            "razorpay_payment_id",
            "razorpay_signature",
            "amount",
            "payment_status",
            "failure_reason",
            "created_at",
            "updated_at",
        )


class CreateRazorpayOrderSerializer(serializers.Serializer):
    bill_id = serializers.IntegerField(min_value=1)


class VerifyRazorpayPaymentSerializer(serializers.Serializer):
    bill_id = serializers.IntegerField(min_value=1)
    razorpay_order_id = serializers.CharField(max_length=120)
    razorpay_payment_id = serializers.CharField(max_length=120)
    razorpay_signature = serializers.CharField(max_length=255)


class RecordPaymentFailureSerializer(serializers.Serializer):
    bill_id = serializers.IntegerField(min_value=1)
    razorpay_order_id = serializers.CharField(max_length=120)
    payment_status = serializers.ChoiceField(
        choices=[PaymentStatus.FAILED, PaymentStatus.CANCELLED]
    )
    failure_reason = serializers.CharField(max_length=255, required=False, default="Payment failed.")
