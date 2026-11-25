import { Bill, Payment } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function downloadInvoiceFile(bill: Bill, payment?: Payment | null) {
  const lines = [
    '============================================================',
    '               CARELEDGER CLINICAL — TAX INVOICE            ',
    '============================================================',
    `Invoice / Bill ID : #BILL-${bill.id}`,
    `Issued Date       : ${formatDateTime(bill.created_at)}`,
    `Payment Status    : ${bill.payment_status.toUpperCase()}`,
    '------------------------------------------------------------',
    `Patient Name      : ${bill.patient_name}`,
    `Patient ID        : #PT-${bill.patient_id}`,
    `Patient Email     : ${bill.patient_email || 'N/A'}`,
    '------------------------------------------------------------',
    `Service           : ${bill.description}`,
    `Base Amount       : INR ${bill.amount.toFixed(2)}`,
    `Tax               : INR ${bill.tax.toFixed(2)}`,
    `Total Payable     : INR ${bill.total_amount.toFixed(2)}`,
    '------------------------------------------------------------',
    payment
      ? [
          `Razorpay Order ID   : ${payment.razorpay_order_id}`,
          `Razorpay Payment ID : ${payment.razorpay_payment_id || 'Pending'}`,
          `Transaction Status  : ${payment.payment_status}`,
          `Updated At          : ${formatDateTime(payment.updated_at)}`,
        ].join('\n')
      : 'Razorpay Payment  : No online transaction recorded yet.',
    '============================================================',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CareLedger_Invoice_BILL-${bill.id}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
