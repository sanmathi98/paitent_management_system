import { axiosClient } from './axiosClient';
import { sandboxStore } from './sandboxStore';
import {
  ApiMode,
  Bill,
  BillFormPayload,
  BillQueryParams,
  DashboardSummary,
  Payment,
  RazorpayOrderResponse,
  VerifyPaymentPayload,
} from '../types';

export const billingApi = {
  async getDashboardSummary(mode: ApiMode): Promise<DashboardSummary> {
    if (mode === 'sandbox') {
      return sandboxStore.getDashboardSummary();
    }
    const response = await axiosClient.get('/dashboard/summary/');
    return response.data?.data || response.data;
  },

  async getBills(params: BillQueryParams, mode: ApiMode): Promise<Bill[]> {
    if (mode === 'sandbox') {
      return sandboxStore.getBills(params);
    }
    const response = await axiosClient.get('/bills/', { params });
    const raw = response.data?.data || response.data;
    return Array.isArray(raw) ? raw : raw.results || [];
  },

  async getBillById(id: number, mode: ApiMode): Promise<Bill> {
    if (mode === 'sandbox') {
      return sandboxStore.getBillById(id);
    }
    const response = await axiosClient.get(`/bills/${id}/`);
    return response.data?.data || response.data;
  },

  async createBill(payload: BillFormPayload, mode: ApiMode): Promise<Bill> {
    if (mode === 'sandbox') {
      return sandboxStore.createBill(payload);
    }
    const response = await axiosClient.post('/bills/', payload);
    return response.data?.data || response.data;
  },

  async updateBill(
    id: number,
    payload: BillFormPayload,
    mode: ApiMode
  ): Promise<Bill> {
    if (mode === 'sandbox') {
      return sandboxStore.updateBill(id, payload);
    }
    const response = await axiosClient.put(`/bills/${id}/`, payload);
    return response.data?.data || response.data;
  },

  async deleteBill(id: number, mode: ApiMode): Promise<void> {
    if (mode === 'sandbox') {
      return sandboxStore.deleteBill(id);
    }
    await axiosClient.delete(`/bills/${id}/`);
  },

  async createRazorpayOrder(
    billId: number,
    mode: ApiMode
  ): Promise<RazorpayOrderResponse> {
    if (mode === 'sandbox') {
      return sandboxStore.createRazorpayOrder(billId);
    }
    const response = await axiosClient.post('/payments/create-order/', {
      bill_id: billId,
    });
    return response.data?.data || response.data;
  },

  async verifyRazorpayPayment(
    payload: VerifyPaymentPayload,
    mode: ApiMode
  ): Promise<Payment> {
    if (mode === 'sandbox') {
      return sandboxStore.verifyRazorpayPayment(payload);
    }
    const response = await axiosClient.post('/payments/verify/', payload);
    return response.data?.data || response.data;
  },

  async recordPaymentFailure(
    billId: number,
    orderId: string,
    status: 'Failed' | 'Cancelled',
    reason: string,
    mode: ApiMode
  ): Promise<Payment> {
    if (mode === 'sandbox') {
      return sandboxStore.recordPaymentFailure(billId, orderId, status, reason);
    }
    const response = await axiosClient.post('/payments/fail/', {
      bill_id: billId,
      razorpay_order_id: orderId,
      payment_status: status,
      failure_reason: reason,
    });
    return response.data?.data || response.data;
  },

  async getPayments(mode: ApiMode, billId?: number): Promise<Payment[]> {
    if (mode === 'sandbox') {
      return sandboxStore.getPayments(billId);
    }
    const response = await axiosClient.get('/payments/', {
      params: billId ? { bill_id: billId } : undefined,
    });
    const raw = response.data?.data || response.data;
    return Array.isArray(raw) ? raw : raw.results || [];
  },
};
