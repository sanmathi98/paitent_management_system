import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmModal } from '../components/ConfirmModal';
import { InvoiceModal } from '../components/InvoiceModal';
import { Layout } from '../components/Layout';
import { RazorpayModal } from '../components/RazorpayModal';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import {
  Bill,
  BillFormPayload,
  Payment,
  PaymentStatus,
  RazorpayOrderResponse,
  VerifyPaymentPayload,
} from '../types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (res: unknown) => void) => void;
    };
  }
}

export function BillingPage() {
  const {
    state,
    fetchBills,
    fetchPayments,
    fetchAllPatientsSimple,
    createBill,
    updateBill,
    deleteBill,
    createRazorpayOrder,
    verifyRazorpayPayment,
    recordPaymentFailure,
    clearBillingErrors,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'bills' | 'payments'>('bills');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');

  const [billFormOpen, setBillFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [patientId, setPatientId] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [viewingInvoiceBill, setViewingInvoiceBill] = useState<Bill | null>(null);
  const [activeRazorpayOrder, setActiveRazorpayOrder] =
    useState<RazorpayOrderResponse | null>(null);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(
    null
  );

  const activeQuery = useMemo(
    () => ({
      search,
      payment_status: statusFilter,
    }),
    [search, statusFilter]
  );

  const loadBillingData = useCallback(() => {
    fetchBills(activeQuery);
    fetchPayments();
    fetchAllPatientsSimple();
  }, [fetchBills, fetchPayments, fetchAllPatientsSimple, activeQuery]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const computedTotal = useMemo(() => {
    const a = Number(amount) || 0;
    const t = Number(tax) || 0;
    return Math.max(0, Number((a + t).toFixed(2)));
  }, [amount, tax]);

  const openCreateBill = () => {
    setEditingBill(null);
    setPatientId(state.patients.allPatients[0]?.id || 0);
    setDescription('');
    setAmount('');
    setTax('0');
    setPaymentStatus('Pending');
    setFormError(null);
    clearBillingErrors();
    setBillFormOpen(true);
  };

  const openEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setPatientId(bill.patient_id);
    setDescription(bill.description);
    setAmount(String(bill.amount));
    setTax(String(bill.tax));
    setPaymentStatus(bill.payment_status);
    setFormError(null);
    clearBillingErrors();
    setBillFormOpen(true);
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientId) {
      setFormError('Please select a patient.');
      return;
    }
    if (!description.trim()) {
      setFormError('Service description is required.');
      return;
    }
    const amtNum = Number(amount);
    const taxNum = Number(tax || 0);
    if (Number.isNaN(amtNum) || amtNum <= 0) {
      setFormError('Amount must be greater than 0.');
      return;
    }
    if (Number.isNaN(taxNum) || taxNum < 0) {
      setFormError('Tax cannot be negative.');
      return;
    }

    const payload: BillFormPayload = {
      patient_id: Number(patientId),
      description: description.trim(),
      amount: amtNum,
      tax: taxNum,
      payment_status: paymentStatus,
    };

    const res = editingBill
      ? await updateBill(editingBill.id, payload, activeQuery)
      : await createBill(payload, activeQuery);

    if (res.ok) {
      setBillFormOpen(false);
    } else {
      setFormError(res.error || 'Could not save bill.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBill) return;
    const ok = await deleteBill(deletingBill.id, activeQuery);
    if (ok) {
      setDeletingBill(null);
    }
  };

  const handleStartPayment = async (bill: Bill) => {
    clearBillingErrors();
    setPaymentSuccessNotice(null);

    const order = await createRazorpayOrder(bill.id);
    if (!order) return;

    // If running against real Django + real Razorpay key, open official Razorpay Checkout
    if (
      state.apiMode === 'django' &&
      window.Razorpay &&
      order.key_id &&
      !order.key_id.includes('sandbox')
    ) {
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: 'CareLedger Clinical',
        description: order.description,
        order_id: order.order_id,
        prefill: {
          name: order.patient_name,
          email: order.patient_email,
          contact: order.patient_phone,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verified = await verifyRazorpayPayment(
            {
              bill_id: order.bill_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            activeQuery
          );
          if (verified.ok) {
            setPaymentSuccessNotice(
              `Bill #${order.bill_id} paid and verified via Razorpay (${response.razorpay_payment_id}).`
            );
          }
        },
        modal: {
          ondismiss: () => {
            recordPaymentFailure(
              order.bill_id,
              order.order_id,
              'Cancelled',
              'Checkout closed before completing payment.',
              activeQuery
            );
          },
        },
      });
      rzp.on('payment.failed', () => {
        recordPaymentFailure(
          order.bill_id,
          order.order_id,
          'Failed',
          'Razorpay payment failed during authorization.',
          activeQuery
        );
      });
      rzp.open();
      return;
    }

    // Otherwise open the interactive Razorpay Checkout simulation modal
    setActiveRazorpayOrder(order);
  };

  const handleVerifyFromModal = async (payload: VerifyPaymentPayload) => {
    const res = await verifyRazorpayPayment(payload, activeQuery);
    setActiveRazorpayOrder(null);
    if (res.ok) {
      setPaymentSuccessNotice(
        `Bill #${payload.bill_id} marked Paid. Razorpay Payment ID: ${payload.razorpay_payment_id}`
      );
    }
  };

  const handleFailureFromModal = async (
    status: 'Failed' | 'Cancelled',
    reason: string
  ) => {
    if (!activeRazorpayOrder) return;
    await recordPaymentFailure(
      activeRazorpayOrder.bill_id,
      activeRazorpayOrder.order_id,
      status,
      reason,
      activeQuery
    );
    setActiveRazorpayOrder(null);
  };

  const getLatestPaymentForBill = (billId: number): Payment | null => {
    return state.billing.payments.find((p) => p.bill_id === billId) || null;
  };

  const applyTaxPreset = (percent: number) => {
    const amt = Number(amount) || 0;
    setTax(String(Number(((amt * percent) / 100).toFixed(2))));
  };

  return (
    <Layout
      primaryAction={{
        label: 'Create Bill',
        onClick: openCreateBill,
      }}
    >
      <div className="space-y-6">
        {/* Sub-navigation & Filters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab('bills')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'bills'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Patient Bills ({state.billing.bills.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment History ({state.billing.payments.length})
            </button>
          </div>

          {activeTab === 'bills' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 lg:justify-end">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bills by patient or ID..."
                  aria-label="Search bills"
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-600"
                />
              </div>

              <div
                className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
                role="group"
                aria-label="Filter bills by payment status"
              >
                {(
                  ['', 'Pending', 'Paid', 'Failed', 'Cancelled'] as const
                ).map((st) => (
                  <button
                    key={st || 'All'}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st || 'All'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notices & Errors */}
        {paymentSuccessNotice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 p-4 text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{paymentSuccessNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Dismiss payment notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {(state.billing.error || state.billing.paymentError) && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{state.billing.paymentError || state.billing.error}</span>
            </div>
            <button
              type="button"
              onClick={clearBillingErrors}
              className="text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bills Table */}
        {activeTab === 'bills' ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Patient Bills
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create invoices, track payment status, and process Razorpay
                  payments.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateBill}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Bill</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              {state.billing.loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((r) => (
                    <div
                      key={r}
                      className="h-11 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : state.billing.bills.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-medium text-slate-900">
                    No bills match your filter
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Create a patient bill to initiate Razorpay payment collection.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Bill ID</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-right">Tax</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.billing.bills.map((bill) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                          #{bill.id}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                          {bill.patient_name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 max-w-[220px] truncate">
                          {bill.description}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-700">
                          {formatCurrency(bill.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-600">
                          {formatCurrency(bill.tax)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrency(bill.total_amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={bill.payment_status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {formatDate(bill.created_at)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {bill.payment_status !== 'Paid' && (
                              <button
                                type="button"
                                disabled={state.billing.paymentLoading}
                                onClick={() => handleStartPayment(bill)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors whitespace-nowrap disabled:opacity-50"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Bill</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setViewingInvoiceBill(bill)}
                              title="View Bill & Invoice"
                              aria-label={`View invoice for bill ${bill.id}`}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditBill(bill)}
                              title="Edit Bill"
                              aria-label={`Edit bill ${bill.id}`}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingBill(bill)}
                              title="Delete Bill"
                              aria-label={`Delete bill ${bill.id}`}
                              className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          /* Payment History Table */
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Razorpay Payment History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of Razorpay orders, payment IDs, and verification
                outcomes.
              </p>
            </div>
            <div className="overflow-x-auto">
              {state.billing.payments.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No payment transactions recorded yet.
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Payment ID</th>
                      <th className="px-4 py-3">Bill & Patient</th>
                      <th className="px-4 py-3">Razorpay Order ID</th>
                      <th className="px-4 py-3">Razorpay Payment ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {state.billing.payments.map((pay) => (
                      <tr
                        key={pay.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                          #{pay.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900">
                            {pay.patient_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Bill #{pay.bill_id} · {pay.bill_description}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                          {pay.razorpay_order_id}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                          {pay.razorpay_payment_id || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-medium text-slate-900">
                          {formatCurrency(pay.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={pay.payment_status} />
                          {pay.failure_reason && (
                            <p className="mt-0.5 text-xs text-red-600 max-w-[200px]">
                              {pay.failure_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right text-xs text-slate-500 whitespace-nowrap tabular-nums">
                          {formatDateTime(pay.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Bill Modal */}
      {billFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bill-form-title"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3
                id="bill-form-title"
                className="text-base font-semibold text-slate-900 font-display"
              >
                {editingBill ? `Edit Bill #${editingBill.id}` : 'Create Patient Bill'}
              </h3>
              <button
                type="button"
                onClick={() => setBillFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Close bill form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="p-6 space-y-4" noValidate>
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="bill-patient"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Patient *
                </label>
                <select
                  id="bill-patient"
                  value={patientId}
                  onChange={(e) => setPatientId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                >
                  <option value={0}>Select a patient...</option>
                  {state.patients.allPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="bill-description"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Service / Description *
                </label>
                <input
                  id="bill-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Cardiology Consultation & Lab Panel"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="bill-amount"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Base Amount (INR) *
                  </label>
                  <input
                    id="bill-amount"
                    type="number"
                    min={1}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="bill-tax"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Tax (INR)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTaxPreset(5)}
                        className="text-[11px] font-medium text-teal-700 hover:underline"
                      >
                        5%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTaxPreset(18)}
                        className="text-[11px] font-medium text-teal-700 hover:underline"
                      >
                        18%
                      </button>
                    </div>
                  </div>
                  <input
                    id="bill-tax"
                    type="number"
                    min={0}
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                <div>
                  <p className="text-xs text-slate-500">Total Payable</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900 font-mono tabular-nums">
                    {formatCurrency(computedTotal)}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="bill-status"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Payment Status
                  </label>
                  <select
                    id="bill-status"
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(e.target.value as PaymentStatus)
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-teal-600"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBillFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state.billing.actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg disabled:opacity-50"
                >
                  {state.billing.actionLoading
                    ? 'Saving...'
                    : editingBill
                      ? 'Save Changes'
                      : 'Create Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details & Print Modal */}
      <InvoiceModal
        bill={viewingInvoiceBill}
        payment={
          viewingInvoiceBill
            ? getLatestPaymentForBill(viewingInvoiceBill.id)
            : null
        }
        onClose={() => setViewingInvoiceBill(null)}
      />

      {/* Interactive Razorpay Checkout Modal */}
      <RazorpayModal
        order={activeRazorpayOrder}
        verifying={state.billing.paymentLoading}
        onSuccessVerify={handleVerifyFromModal}
        onFailure={handleFailureFromModal}
        onClose={() => setActiveRazorpayOrder(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingBill)}
        title="Delete Bill Record"
        message={
          deletingBill
            ? `Are you sure you want to delete Bill #${deletingBill.id} for ${deletingBill.patient_name}?`
            : ''
        }
        confirmLabel="Delete Bill"
        loading={state.billing.actionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingBill(null)}
      />
    </Layout>
  );
}
