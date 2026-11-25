from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = (
            "id",
            "name",
            "age",
            "gender",
            "phone_number",
            "email",
            "address",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Patient name is required.")
        return cleaned

    def validate_age(self, value: int) -> int:
        if value < 0 or value > 130:
            raise serializers.ValidationError("Age must be between 0 and 130.")
        return value

    def validate_phone_number(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 7:
            raise serializers.ValidationError("Enter a valid phone number.")
        return cleaned

    def validate_email(self, value: str) -> str:
        normalized = value.strip().lower()
        qs = Patient.objects.filter(email=normalized)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A patient with this email already exists.")
        return normalized

    def validate_address(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Address is required.")
        return cleaned
