import { Download, Printer, X } from 'lucide-react';
import { Bill, Payment } from '../types';
import {
  downloadInvoiceFile,
  formatCurrency,
  formatDateTime,
} from '../utils/formatters';
import { StatusBadge } from './StatusBadge';

interface InvoiceModalProps {
  bill: Bill | null;
  payment?: Payment | null;
  onClose: () => void;
}

export function InvoiceModal({ bill, payment, onClose }: InvoiceModalProps) {
  if (!bill) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 no-print">
          <h3
            id="invoice-modal-title"
            className="text-base font-semibold text-slate-900"
          >
            Bill & Invoice Details
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadInvoiceFile(bill, payment)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
              aria-label="Close invoice modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <p className="text-lg font-bold text-slate-900 font-display">
                CareLedger Clinical
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Patient Billing Statement · Tax Invoice
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-semibold text-slate-900">
                BILL-{bill.id}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime(bill.created_at)}
              </p>
              <div className="mt-2 flex justify-end">
                <StatusBadge status={bill.payment_status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Billed To</p>
              <p className="mt-1 font-semibold text-slate-900">
                {bill.patient_name}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 font-mono">
                Patient ID #{bill.patient_id}
              </p>
              {bill.patient_email && (
                <p className="mt-0.5 text-xs text-slate-600">
                  {bill.patient_email}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">
                Payment Reference
              </p>
              {payment ? (
                <div className="mt-1 space-y-1 text-xs">
                  <p className="text-slate-700">
                    Order ID:{' '}
                    <span className="font-mono text-slate-900">
                      {payment.razorpay_order_id}
                    </span>
                  </p>
                  <p className="text-slate-700">
                    Payment ID:{' '}
                    <span className="font-mono text-slate-900">
                      {payment.razorpay_payment_id || 'Pending'}
                    </span>
                  </p>
                  <p className="text-slate-700">
                    Updated: {formatDateTime(payment.updated_at)}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  No online payment transaction recorded yet.
                </p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
                <tr>
                  <th className="px-4 py-3">Service / Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3.5 text-slate-900">
                    {bill.description}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-900">
                    {formatCurrency(bill.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600">Applicable Tax</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    {formatCurrency(bill.tax)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3.5 text-slate-900">Total Amount</td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-900">
                    {formatCurrency(bill.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
