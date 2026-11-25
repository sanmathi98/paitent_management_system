from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Bill, Payment
from .serializers import (
    BillSerializer,
    CreateRazorpayOrderSerializer,
    PaymentSerializer,
    RecordPaymentFailureSerializer,
    VerifyRazorpayPaymentSerializer,
)
from .services import (
    create_razorpay_order_for_bill,
    get_dashboard_summary,
    mark_payment_failed_or_cancelled,
    verify_and_complete_payment,
)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request):
        summary = get_dashboard_summary()
        return Response({"success": True, "data": summary}, status=status.HTTP_200_OK)


class BillListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Bill.objects.select_related("patient").all()
        patient_id = request.query_params.get("patient_id")
        payment_status = request.query_params.get("payment_status")
        search = request.query_params.get("search", "").strip()

        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if search:
            queryset = queryset.filter(
                Q(patient__name__icontains=search)
                | Q(description__icontains=search)
                | Q(id__icontains=search)
            )

        serializer = BillSerializer(queryset, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = BillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = serializer.save()
        return Response(
            {"success": True, "data": BillSerializer(bill).data},
            status=status.HTTP_201_CREATED,
        )


class BillDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, _request, pk: int):
        bill = get_object_or_404(Bill.objects.select_related("patient"), pk=pk)
        return Response(
            {"success": True, "data": BillSerializer(bill).data},
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk: int):
        bill = get_object_or_404(Bill, pk=pk)
        serializer = BillSerializer(bill, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(
            {"success": True, "data": BillSerializer(updated).data},
            status=status.HTTP_200_OK,
        )

    def delete(self, _request, pk: int):
        bill = get_object_or_404(Bill, pk=pk)
        bill.delete()
        return Response(
            {"success": True, "message": "Bill deleted successfully."},
            status=status.HTTP_204_NO_CONTENT,
        )


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateRazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = get_object_or_404(
            Bill.objects.select_related("patient"),
            pk=serializer.validated_data["bill_id"],
        )
        order_payload = create_razorpay_order_for_bill(bill)
        return Response(
            {"success": True, "data": order_payload},
            status=status.HTTP_201_CREATED,
        )


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyRazorpayPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = get_object_or_404(
            Bill.objects.select_related("patient"),
            pk=serializer.validated_data["bill_id"],
        )
        payment = verify_and_complete_payment(
            bill=bill,
            razorpay_order_id=serializer.validated_data["razorpay_order_id"],
            razorpay_payment_id=serializer.validated_data["razorpay_payment_id"],
            razorpay_signature=serializer.validated_data["razorpay_signature"],
        )
        return Response(
            {"success": True, "data": PaymentSerializer(payment).data},
            status=status.HTTP_200_OK,
        )


class RecordPaymentFailureView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RecordPaymentFailureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bill = get_object_or_404(Bill, pk=serializer.validated_data["bill_id"])
        payment = mark_payment_failed_or_cancelled(
            bill=bill,
            razorpay_order_id=serializer.validated_data["razorpay_order_id"],
            payment_status=serializer.validated_data["payment_status"],
            failure_reason=serializer.validated_data["failure_reason"],
        )
        return Response(
            {"success": True, "data": PaymentSerializer(payment).data},
            status=status.HTTP_200_OK,
        )


class PaymentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Payment.objects.select_related("bill", "bill__patient").all()
        bill_id = request.query_params.get("bill_id")
        if bill_id:
            queryset = queryset.filter(bill_id=bill_id)
        serializer = PaymentSerializer(queryset, many=True)
        return Response(
            {"success": True, "data": serializer.data},
            status=status.HTTP_200_OK,
        )
