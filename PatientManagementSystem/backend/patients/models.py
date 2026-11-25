from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Patient(models.Model):
    class GenderChoices(models.TextChoices):
        MALE = "Male", "Male"
        FEMALE = "Female", "Female"
        OTHER = "Other", "Other"

    name = models.CharField(max_length=150, db_index=True)
    age = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(130)]
    )
    gender = models.CharField(
        max_length=16,
        choices=GenderChoices.choices,
        db_index=True,
    )
    phone_number = models.CharField(max_length=30)
    email = models.EmailField(max_length=255, unique=True)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patients"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} (#{self.id})"
