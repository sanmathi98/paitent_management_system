from django.urls import path
from .views import (
    BillDetailView,
    BillListCreateView,
    CreateRazorpayOrderView,
    DashboardSummaryView,
    PaymentListView,
    RecordPaymentFailureView,
    VerifyRazorpayPaymentView,
)

urlpatterns = [
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("bills/", BillListCreateView.as_view(), name="bill-list-create"),
    path("bills/<int:pk>/", BillDetailView.as_view(), name="bill-detail"),
    path("payments/", PaymentListView.as_view(), name="payment-list"),
    path("payments/create-order/", CreateRazorpayOrderView.as_view(), name="payment-create-order"),
    path("payments/verify/", VerifyRazorpayPaymentView.as_view(), name="payment-verify"),
    path("payments/fail/", RecordPaymentFailureView.as_view(), name="payment-fail"),
]
