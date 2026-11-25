from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer


def build_auth_response(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def register_clinic_user(name: str, email: str, password: str) -> dict:
    user = User.objects.create_user(
        email=email,
        name=name,
        password=password,
    )
    return build_auth_response(user)
