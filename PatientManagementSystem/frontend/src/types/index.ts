export type Gender = 'Male' | 'Female' | 'Other';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Cancelled';

export type ApiMode = 'sandbox' | 'django';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirm_password?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: Gender;
  phone_number: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface PatientFormPayload {
  name: string;
  age: number;
  gender: Gender;
  phone_number: string;
  email: string;
  address: string;
}

export interface PatientQueryParams {
  search?: string;
  gender?: Gender | '';
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

export interface Bill {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_email?: string;
  description: string;
  amount: number;
  tax: number;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface BillFormPayload {
  patient_id: number;
  description: string;
  amount: number;
  tax: number;
  payment_status?: PaymentStatus;
}

export interface BillQueryParams {
  search?: string;
  payment_status?: PaymentStatus | '';
  patient_id?: number;
}

export interface Payment {
  id: number;
  bill_id: number;
  patient_name: string;
  bill_description: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  payment_status: PaymentStatus;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RazorpayOrderResponse {
  order_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  key_id: string;
  bill_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  description: string;
}

export interface VerifyPaymentPayload {
  bill_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface DashboardSummary {
  total_patients: number;
  recently_added_patients: Patient[];
  total_bills: number;
  total_paid_amount: number;
  total_pending_amount: number;
  recent_bills: Bill[];
}

export interface ApiErrorShape {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
}
