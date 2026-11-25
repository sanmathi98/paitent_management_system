import { CreditCard, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { generateSandboxSignature } from '../api/sandboxStore';
import { RazorpayOrderResponse, VerifyPaymentPayload } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RazorpayModalProps {
  order: RazorpayOrderResponse | null;
  verifying: boolean;
  onSuccessVerify: (payload: VerifyPaymentPayload) => void;
  onFailure: (status: 'Failed' | 'Cancelled', reason: string) => void;
  onClose: () => void;
}

export function RazorpayModal({
  order,
  verifying,
  onSuccessVerify,
  onFailure,
  onClose,
}: RazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  if (!order) return null;

  const handleSimulateSuccess = () => {
    const paymentId = `pay_Sbx${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    const signature = generateSandboxSignature(order.order_id, paymentId);
    onSuccessVerify({
      bill_id: order.bill_id,
      razorpay_order_id: order.order_id,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });
  };

  const handleSimulateBadSignature = () => {
    const paymentId = `pay_Tampered${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    onSuccessVerify({
      bill_id: order.bill_id,
      razorpay_order_id: order.order_id,
      razorpay_payment_id: paymentId,
      razorpay_signature: 'invalid_tampered_signature_0000',
    });
  };

  const handleSimulateBankFailure = () => {
    onFailure(
      'Failed',
      'Payment authorization failed at the issuing bank gateway.'
    );
  };

  const handleCancelCheckout = () => {
    onFailure('Cancelled', 'Payment checkout was cancelled by the user.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="razorpay-checkout-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-300">
              CareLedger Clinical · Razorpay Checkout
            </p>
            <h3
              id="razorpay-checkout-title"
              className="mt-1 text-lg font-semibold tabular-nums"
            >
              {formatCurrency(order.amount)}
            </h3>
            <p className="mt-1 text-xs text-slate-300 font-mono">
              {order.order_id}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancelCheckout}
            disabled={verifying}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close Razorpay checkout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Patient</span>
              <span className="font-medium text-slate-900">
                {order.patient_name}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-slate-600">
              <span>Bill Reference</span>
              <span className="font-mono text-slate-900">#{order.bill_id}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-slate-600 gap-4">
              <span className="shrink-0">Description</span>
              <span className="text-right text-slate-800 truncate">
                {order.description}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">
              Select Payment Method
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'upi', label: 'UPI / QR' },
                  { id: 'card', label: 'Card' },
                  { id: 'netbanking', label: 'Netbanking' },
                ] as const
              ).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    selectedMethod === method.id
                      ? 'bg-teal-50 border-teal-600 text-teal-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              disabled={verifying}
              onClick={handleSimulateSuccess}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {verifying
                  ? 'Verifying Signature...'
                  : `Complete Payment (${formatCurrency(order.amount)})`}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={verifying}
                onClick={handleSimulateBankFailure}
                className="py-2 px-3 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Simulate Bank Failure
              </button>
              <button
                type="button"
                disabled={verifying}
                onClick={handleSimulateBadSignature}
                className="py-2 px-3 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Test Invalid Signature
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p>
              Preview sandbox checkout simulates Razorpay Order creation and
              server-side HMAC-SHA256 signature verification. When connected to
              Django, real Razorpay Checkout opens with your backend key ID.
            </p>
          </div>
          {verifying && (
            <div className="flex items-center gap-2 text-xs text-teal-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying payment signature with server...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
