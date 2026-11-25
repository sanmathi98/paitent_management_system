from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Patient
from .serializers import PatientSerializer
from .services import query_patients


class PatientListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search = request.query_params.get("search", "")
        gender = request.query_params.get("gender", "")
        sort = request.query_params.get("sort", "newest")
        try:
            page = int(request.query_params.get("page", 1))
            page_size = int(request.query_params.get("page_size", 8))
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid pagination parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        paginated = query_patients(
            search=search,
            gender=gender,
            sort=sort,
            page=page,
            page_size=page_size,
        )
        serialized = PatientSerializer(paginated["object_list"], many=True).data
        return Response(
            {
                "success": True,
                "data": {
                    "count": paginated["count"],
                    "page": paginated["page"],
                    "page_size": paginated["page_size"],
                    "total_pages": paginated["total_pages"],
                    "results": serialized,
                },
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = PatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        return Response(
            {"success": True, "data": PatientSerializer(patient).data},
            status=status.HTTP_201_CREATED,
        )


class PatientDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        patient = get_object_or_404(Patient, pk=pk)
        return Response(
            {"success": True, "data": PatientSerializer(patient).data},
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk: int):
        patient = get_object_or_404(Patient, pk=pk)
        serializer = PatientSerializer(patient, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(
            {"success": True, "data": PatientSerializer(updated).data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk: int):
        patient = get_object_or_404(Patient, pk=pk)
        patient.delete()
        return Response(
            {"success": True, "message": "Patient deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )
