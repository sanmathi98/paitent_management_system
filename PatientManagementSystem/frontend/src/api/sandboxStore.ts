import {
  AuthResponse,
  Bill,
  BillFormPayload,
  BillQueryParams,
  DashboardSummary,
  LoginPayload,
  PaginatedResponse,
  Patient,
  PatientFormPayload,
  PatientQueryParams,
  Payment,
  RazorpayOrderResponse,
  RegisterPayload,
  User,
  VerifyPaymentPayload,
} from '../types';

class SandboxError extends Error {
  isSandboxError = true;
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status = 400,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface SandboxUserRecord extends User {
  passwordHash: string;
}

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function simpleDigest(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `sbx_${Math.abs(hash).toString(16)}`;
}

// Initial in-memory clinical records simulating MySQL tables
const db: {
  users: SandboxUserRecord[];
  patients: Patient[];
  bills: Bill[];
  payments: Payment[];
  nextUserId: number;
  nextPatientId: number;
  nextBillId: number;
  nextPaymentId: number;
  activeUserId: number | null;
} = {
  users: [
    {
      id: 1,
      name: 'Dr. Evelyn Reed',
      email: 'clinic.admin@careledger.org',
      role: 'Medical Director',
      passwordHash: simpleDigest('CareClinic2026!'),
      created_at: '2026-10-12T08:30:00Z',
    },
  ],
  patients: [
    {
      id: 101,
      name: 'Aarav Kulkarni',
      age: 38,
      gender: 'Male',
      phone_number: '+91 98204 51290',
      email: 'aarav.kulkarni@example.com',
      address: '42 Marine Drive, Churchgate, Mumbai 400020',
      created_at: '2026-11-18T09:15:00Z',
      updated_at: '2026-11-18T09:15:00Z',
    },
    {
      id: 102,
      name: 'Meera Nair',
      age: 29,
      gender: 'Female',
      phone_number: '+91 98450 22319',
      email: 'meera.nair@example.com',
      address: '18 Indiranagar 12th Main, Bengaluru 560038',
      created_at: '2026-11-19T11:40:00Z',
      updated_at: '2026-11-19T11:40:00Z',
    },
    {
      id: 103,
      name: 'Rohan Deshmukh',
      age: 54,
      gender: 'Male',
      phone_number: '+91 97654 88102',
      email: 'rohan.deshmukh@example.com',
      address: '7 Koregaon Park Lane 4, Pune 411001',
      created_at: '2026-11-20T14:20:00Z',
      updated_at: '2026-11-20T14:20:00Z',
    },
    {
      id: 104,
      name: 'Ananya Chatterjee',
      age: 44,
      gender: 'Female',
      phone_number: '+91 98301 66451',
      email: 'ananya.chatterjee@example.com',
      address: '109 Ballygunge Circular Rd, Kolkata 700019',
      created_at: '2026-11-22T10:05:00Z',
      updated_at: '2026-11-22T10:05:00Z',
    },
    {
      id: 105,
      name: 'Kabir Malhotra',
      age: 33,
      gender: 'Other',
      phone_number: '+91 98112 73940',
      email: 'kabir.malhotra@example.com',
      address: '214 Greater Kailash Part I, New Delhi 110048',
      created_at: '2026-11-24T16:45:00Z',
      updated_at: '2026-11-24T16:45:00Z',
    },
  ],
  bills: [
    {
      id: 5001,
      patient_id: 101,
      patient_name: 'Aarav Kulkarni',
      patient_email: 'aarav.kulkarni@example.com',
      description: 'Comprehensive Cardiology Consultation & ECG',
      amount: 2500,
      tax: 450,
      total_amount: 2950,
      payment_status: 'Paid',
      created_at: '2026-11-18T10:00:00Z',
      updated_at: '2026-11-18T10:15:00Z',
    },
    {
      id: 5002,
      patient_id: 102,
      patient_name: 'Meera Nair',
      patient_email: 'meera.nair@example.com',
      description: 'Complete Blood Count & Thyroid Panel',
      amount: 1800,
      tax: 324,
      total_amount: 2124,
      payment_status: 'Pending',
      created_at: '2026-11-19T12:10:00Z',
      updated_at: '2026-11-19T12:10:00Z',
    },
    {
      id: 5003,
      patient_id: 103,
      patient_name: 'Rohan Deshmukh',
      patient_email: 'rohan.deshmukh@example.com',
      description: 'Orthopedic Follow-up & Digital X-Ray',
      amount: 3200,
      tax: 576,
      total_amount: 3776,
      payment_status: 'Pending',
      created_at: '2026-11-20T15:00:00Z',
      updated_at: '2026-11-20T15:00:00Z',
    },
    {
      id: 5004,
      patient_id: 104,
      patient_name: 'Ananya Chatterjee',
      patient_email: 'ananya.chatterjee@example.com',
      description: 'Annual Preventive Health Screening',
      amount: 4500,
      tax: 810,
      total_amount: 5310,
      payment_status: 'Paid',
      created_at: '2026-11-22T11:30:00Z',
      updated_at: '2026-11-22T11:45:00Z',
    },
    {
      id: 5005,
      patient_id: 105,
      patient_name: 'Kabir Malhotra',
      patient_email: 'kabir.malhotra@example.com',
      description: 'Pulmonary Function Test & Spirometry',
      amount: 2100,
      tax: 378,
      total_amount: 2478,
      payment_status: 'Failed',
      created_at: '2026-11-24T17:10:00Z',
      updated_at: '2026-11-24T17:15:00Z',
    },
  ],
  payments: [
    {
      id: 9001,
      bill_id: 5001,
      patient_name: 'Aarav Kulkarni',
      bill_description: 'Comprehensive Cardiology Consultation & ECG',
      razorpay_order_id: 'order_Care9A18B72C',
      razorpay_payment_id: 'pay_Care9A18X991',
      razorpay_signature: 'sig_verified_9f8e7d6c5b4a',
      amount: 2950,
      payment_status: 'Paid',
      created_at: '2026-11-18T10:15:00Z',
      updated_at: '2026-11-18T10:15:00Z',
    },
    {
      id: 9002,
      bill_id: 5004,
      patient_name: 'Ananya Chatterjee',
      bill_description: 'Annual Preventive Health Screening',
      razorpay_order_id: 'order_Care7D44E10F',
      razorpay_payment_id: 'pay_Care7D44Y302',
      razorpay_signature: 'sig_verified_3a2b1c4d5e6f',
      amount: 5310,
      payment_status: 'Paid',
      created_at: '2026-11-22T11:45:00Z',
      updated_at: '2026-11-22T11:45:00Z',
    },
    {
      id: 9003,
      bill_id: 5005,
      patient_name: 'Kabir Malhotra',
      bill_description: 'Pulmonary Function Test & Spirometry',
      razorpay_order_id: 'order_Care5C11K90P',
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount: 2478,
      payment_status: 'Failed',
      failure_reason: 'Payment authorization declined by issuing bank.',
      created_at: '2026-11-24T17:15:00Z',
      updated_at: '2026-11-24T17:15:00Z',
    },
  ],
  nextUserId: 2,
  nextPatientId: 106,
  nextBillId: 5006,
  nextPaymentId: 9004,
  activeUserId: null,
};

const orderSecrets = new Map<string, string>();

function expectedSandboxSignature(orderId: string, paymentId: string): string {
  return simpleDigest(`${orderId}|${paymentId}|sandbox_hmac_check`);
}

export function generateSandboxSignature(orderId: string, paymentId: string): string {
  return expectedSandboxSignature(orderId, paymentId);
}

export const sandboxStore = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    await delay(200);
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    if (!email || !password) {
      throw new SandboxError('Email and password are required.', 400, {
        email: !email ? 'Email is required.' : '',
        password: !password ? 'Password is required.' : '',
      });
    }

    if (!emailRegex.test(email)) {
      throw new SandboxError('Please enter a valid email address.', 400, {
        email: 'Invalid email format.',
      });
    }

    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.passwordHash !== simpleDigest(password)) {
      throw new SandboxError('Invalid email or password.', 401);
    }

    db.activeUserId = user.id;
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      tokens: {
        access: `sandbox.jwt.access.${user.id}.${Date.now()}`,
        refresh: `sandbox.jwt.refresh.${user.id}.${Date.now()}`,
      },
    };
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await delay(240);
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = 'Full name is required.';
    if (!email) fieldErrors.email = 'Email is required.';
    else if (!emailRegex.test(email)) fieldErrors.email = 'Invalid email format.';
    if (!password || password.length < 6) {
      fieldErrors.password = 'Password must be at least 6 characters.';
    }
    if (
      payload.confirm_password !== undefined &&
      payload.confirm_password !== password
    ) {
      fieldErrors.confirm_password = 'Passwords do not match.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new SandboxError(Object.values(fieldErrors)[0], 400, fieldErrors);
    }

    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw new SandboxError(
        'An account with this email already exists.',
        409,
        { email: 'Duplicate email address.' }
      );
    }

    const newUser: SandboxUserRecord = {
      id: db.nextUserId++,
      name,
      email,
      role: 'Clinic Staff',
      passwordHash: simpleDigest(password),
      created_at: new Date().toISOString(),
    };
    db.users.push(newUser);
    db.activeUserId = newUser.id;

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
      },
      tokens: {
        access: `sandbox.jwt.access.${newUser.id}.${Date.now()}`,
        refresh: `sandbox.jwt.refresh.${newUser.id}.${Date.now()}`,
      },
    };
  },

  async getPatients(
    params: PatientQueryParams = {}
  ): Promise<PaginatedResponse<Patient>> {
    await delay(140);
    let list = [...db.patients];

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone_number.toLowerCase().includes(q)
      );
    }

    if (params.gender) {
      list = list.filter((p) => p.gender === params.gender);
    }

    switch (params.sort) {
      case 'oldest':
        list.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
      default:
        list.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
    }

    const pageSize = params.page_size || 8;
    const page = Math.max(1, params.page || 1);
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      count: list.length,
      page: safePage,
      page_size: pageSize,
      total_pages: totalPages,
      results: list.slice(start, start + pageSize),
    };
  },

  async getAllPatientsUnpaginated(): Promise<Patient[]> {
    await delay(100);
    return [...db.patients].sort((a, b) => a.name.localeCompare(b.name));
  },

  async getPatientById(id: number): Promise<Patient> {
    await delay(120);
    const found = db.patients.find((p) => p.id === id);
    if (!found) {
      throw new SandboxError('Patient record not found.', 404);
    }
    return { ...found };
  },

  async createPatient(payload: PatientFormPayload): Promise<Patient> {
    await delay(180);
    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone_number.trim();
    const address = payload.address.trim();
    const age = Number(payload.age);

    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = 'Patient name is required.';
    if (!Number.isInteger(age) || age < 0 || age > 130) {
      fieldErrors.age = 'Age must be a valid whole number between 0 and 130.';
    }
    if (!['Male', 'Female', 'Other'].includes(payload.gender)) {
      fieldErrors.gender = 'Please select a valid gender.';
    }
    if (!phone || phone.length < 7) {
      fieldErrors.phone_number = 'A valid phone number is required.';
    }
    if (!email || !emailRegex.test(email)) {
      fieldErrors.email = 'Please provide a valid email address.';
    }
    if (!address) fieldErrors.address = 'Address is required.';

    if (Object.keys(fieldErrors).length > 0) {
      throw new SandboxError(Object.values(fieldErrors)[0], 400, fieldErrors);
    }

    if (db.patients.some((p) => p.email.toLowerCase() === email)) {
      throw new SandboxError(
        'A patient with this email address is already registered.',
        409,
        { email: 'Duplicate email address.' }
      );
    }

    const now = new Date().toISOString();
    const newPatient: Patient = {
      id: db.nextPatientId++,
      name,
      age,
      gender: payload.gender,
      phone_number: phone,
      email,
      address,
      created_at: now,
      updated_at: now,
    };
    db.patients.unshift(newPatient);
    return { ...newPatient };
  },

  async updatePatient(
    id: number,
    payload: PatientFormPayload
  ): Promise<Patient> {
    await delay(180);
    const idx = db.patients.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new SandboxError('Patient record not found.', 404);
    }

    const name = payload.name.trim();
    const email = payload.email.trim().toLowerCase();
    const phone = payload.phone_number.trim();
    const address = payload.address.trim();
    const age = Number(payload.age);

    const fieldErrors: Record<string, string> = {};
    if (!name) fieldErrors.name = 'Patient name is required.';
    if (!Number.isInteger(age) || age < 0 || age > 130) {
      fieldErrors.age = 'Age must be a valid whole number between 0 and 130.';
    }
    if (!phone || phone.length < 7) {
      fieldErrors.phone_number = 'A valid phone number is required.';
    }
    if (!email || !emailRegex.test(email)) {
      fieldErrors.email = 'Please provide a valid email address.';
    }
    if (!address) fieldErrors.address = 'Address is required.';

    if (Object.keys(fieldErrors).length > 0) {
      throw new SandboxError(Object.values(fieldErrors)[0], 400, fieldErrors);
    }

    if (
      db.patients.some((p) => p.id !== id && p.email.toLowerCase() === email)
    ) {
      throw new SandboxError(
        'Another patient already uses this email address.',
        409,
        { email: 'Duplicate email address.' }
      );
    }

    const updated: Patient = {
      ...db.patients[idx],
      name,
      age,
      gender: payload.gender,
      phone_number: phone,
      email,
      address,
      updated_at: new Date().toISOString(),
    };
    db.patients[idx] = updated;

    // Sync patient name on linked bills
    db.bills = db.bills.map((b) =>
      b.patient_id === id
        ? { ...b, patient_name: updated.name, patient_email: updated.email }
        : b
    );

    return { ...updated };
  },

  async deletePatient(id: number): Promise<void> {
    await delay(160);
    const exists = db.patients.some((p) => p.id === id);
    if (!exists) {
      throw new SandboxError('Patient record not found.', 404);
    }
    const removedBillIds = db.bills
      .filter((b) => b.patient_id === id)
      .map((b) => b.id);
    db.patients = db.patients.filter((p) => p.id !== id);
    db.bills = db.bills.filter((b) => b.patient_id !== id);
    db.payments = db.payments.filter(
      (pay) => !removedBillIds.includes(pay.bill_id)
    );
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    await delay(140);
    const sortedPatients = [...db.patients].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const sortedBills = [...db.bills].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );

    const totalPaid = db.bills
      .filter((b) => b.payment_status === 'Paid')
      .reduce((acc, b) => acc + b.total_amount, 0);

    const totalPending = db.bills
      .filter((b) => b.payment_status === 'Pending' || b.payment_status === 'Failed')
      .reduce((acc, b) => acc + b.total_amount, 0);

    return {
      total_patients: db.patients.length,
      recently_added_patients: sortedPatients.slice(0, 5),
      total_bills: db.bills.length,
      total_paid_amount: Number(totalPaid.toFixed(2)),
      total_pending_amount: Number(totalPending.toFixed(2)),
      recent_bills: sortedBills.slice(0, 5),
    };
  },

  async getBills(params: BillQueryParams = {}): Promise<Bill[]> {
    await delay(140);
    let list = [...db.bills];
    if (params.patient_id) {
      list = list.filter((b) => b.patient_id === params.patient_id);
    }
    if (params.payment_status) {
      list = list.filter((b) => b.payment_status === params.payment_status);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.patient_name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          String(b.id).includes(q)
      );
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getBillById(id: number): Promise<Bill> {
    await delay(100);
    const found = db.bills.find((b) => b.id === id);
    if (!found) {
      throw new SandboxError('Bill record not found.', 404);
    }
    return { ...found };
  },

  async createBill(payload: BillFormPayload): Promise<Bill> {
    await delay(180);
    const patient = db.patients.find((p) => p.id === Number(payload.patient_id));
    if (!patient) {
      throw new SandboxError('Selected patient was not found.', 404, {
        patient_id: 'Please select a valid patient.',
      });
    }

    const amount = Number(payload.amount);
    const tax = Number(payload.tax);
    const description = payload.description.trim();

    const fieldErrors: Record<string, string> = {};
    if (!description) fieldErrors.description = 'Service description is required.';
    if (Number.isNaN(amount) || amount <= 0) {
      fieldErrors.amount = 'Bill amount must be greater than zero.';
    }
    if (Number.isNaN(tax) || tax < 0) {
      fieldErrors.tax = 'Tax cannot be negative.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new SandboxError(Object.values(fieldErrors)[0], 400, fieldErrors);
    }

    const now = new Date().toISOString();
    const newBill: Bill = {
      id: db.nextBillId++,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_email: patient.email,
      description,
      amount: Number(amount.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total_amount: Number((amount + tax).toFixed(2)),
      payment_status: payload.payment_status || 'Pending',
      created_at: now,
      updated_at: now,
    };
    db.bills.unshift(newBill);
    return { ...newBill };
  },

  async updateBill(id: number, payload: BillFormPayload): Promise<Bill> {
    await delay(180);
    const idx = db.bills.findIndex((b) => b.id === id);
    if (idx === -1) {
      throw new SandboxError('Bill record not found.', 404);
    }

    const patient = db.patients.find((p) => p.id === Number(payload.patient_id));
    if (!patient) {
      throw new SandboxError('Selected patient was not found.', 404);
    }

    const amount = Number(payload.amount);
    const tax = Number(payload.tax);
    const description = payload.description.trim();

    if (!description) {
      throw new SandboxError('Service description is required.', 400, {
        description: 'Service description is required.',
      });
    }
    if (Number.isNaN(amount) || amount <= 0) {
      throw new SandboxError('Bill amount must be greater than zero.', 400, {
        amount: 'Amount must be greater than 0.',
      });
    }
    if (Number.isNaN(tax) || tax < 0) {
      throw new SandboxError('Tax cannot be negative.', 400, {
        tax: 'Tax cannot be negative.',
      });
    }

    const updated: Bill = {
      ...db.bills[idx],
      patient_id: patient.id,
      patient_name: patient.name,
      patient_email: patient.email,
      description,
      amount: Number(amount.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total_amount: Number((amount + tax).toFixed(2)),
      payment_status: payload.payment_status || db.bills[idx].payment_status,
      updated_at: new Date().toISOString(),
    };
    db.bills[idx] = updated;
    return { ...updated };
  },

  async deleteBill(id: number): Promise<void> {
    await delay(160);
    const exists = db.bills.some((b) => b.id === id);
    if (!exists) {
      throw new SandboxError('Bill record not found.', 404);
    }
    db.bills = db.bills.filter((b) => b.id !== id);
    db.payments = db.payments.filter((p) => p.bill_id !== id);
  },

  async createRazorpayOrder(billId: number): Promise<RazorpayOrderResponse> {
    await delay(220);
    const bill = db.bills.find((b) => b.id === billId);
    if (!bill) {
      throw new SandboxError('Bill not found for payment.', 404);
    }
    if (bill.payment_status === 'Paid') {
      throw new SandboxError('This bill has already been paid.', 400);
    }
    if (bill.total_amount <= 0) {
      throw new SandboxError('Invalid bill amount for Razorpay order.', 400);
    }

    const patient = db.patients.find((p) => p.id === bill.patient_id);
    const orderId = `order_Sbx${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
    const now = new Date().toISOString();

    orderSecrets.set(orderId, String(bill.id));

    db.payments.unshift({
      id: db.nextPaymentId++,
      bill_id: bill.id,
      patient_name: bill.patient_name,
      bill_description: bill.description,
      razorpay_order_id: orderId,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount: bill.total_amount,
      payment_status: 'Pending',
      created_at: now,
      updated_at: now,
    });

    return {
      order_id: orderId,
      amount: bill.total_amount,
      amount_paise: Math.round(bill.total_amount * 100),
      currency: 'INR',
      key_id: 'rzp_test_sandbox_demo',
      bill_id: bill.id,
      patient_name: bill.patient_name,
      patient_email: patient?.email || 'patient@example.com',
      patient_phone: patient?.phone_number || '+91 90000 00000',
      description: bill.description,
    };
  },

  async verifyRazorpayPayment(payload: VerifyPaymentPayload): Promise<Payment> {
    await delay(240);
    const paymentIdx = db.payments.findIndex(
      (p) =>
        p.razorpay_order_id === payload.razorpay_order_id &&
        p.bill_id === payload.bill_id
    );
    if (paymentIdx === -1) {
      throw new SandboxError('Payment order record not found.', 404);
    }

    const expectedSig = expectedSandboxSignature(
      payload.razorpay_order_id,
      payload.razorpay_payment_id
    );

    if (payload.razorpay_signature !== expectedSig) {
      db.payments[paymentIdx] = {
        ...db.payments[paymentIdx],
        razorpay_payment_id: payload.razorpay_payment_id,
        razorpay_signature: payload.razorpay_signature,
        payment_status: 'Failed',
        failure_reason: 'Invalid Razorpay HMAC-SHA256 signature.',
        updated_at: new Date().toISOString(),
      };
      const billIdx = db.bills.findIndex((b) => b.id === payload.bill_id);
      if (billIdx !== -1) {
        db.bills[billIdx] = {
          ...db.bills[billIdx],
          payment_status: 'Failed',
          updated_at: new Date().toISOString(),
        };
      }
      throw new SandboxError(
        'Invalid payment signature. Verification failed and transaction was rejected.',
        400
      );
    }

    const now = new Date().toISOString();
    const updatedPayment: Payment = {
      ...db.payments[paymentIdx],
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
      payment_status: 'Paid',
      failure_reason: null,
      updated_at: now,
    };
    db.payments[paymentIdx] = updatedPayment;

    const billIdx = db.bills.findIndex((b) => b.id === payload.bill_id);
    if (billIdx !== -1) {
      db.bills[billIdx] = {
        ...db.bills[billIdx],
        payment_status: 'Paid',
        updated_at: now,
      };
    }

    return { ...updatedPayment };
  },

  async recordPaymentFailure(
    billId: number,
    orderId: string,
    status: 'Failed' | 'Cancelled',
    reason: string
  ): Promise<Payment> {
    await delay(140);
    const now = new Date().toISOString();
    const paymentIdx = db.payments.findIndex(
      (p) => p.razorpay_order_id === orderId && p.bill_id === billId
    );

    if (paymentIdx !== -1) {
      db.payments[paymentIdx] = {
        ...db.payments[paymentIdx],
        payment_status: status,
        failure_reason: reason,
        updated_at: now,
      };
    }

    const billIdx = db.bills.findIndex((b) => b.id === billId);
    if (billIdx !== -1 && db.bills[billIdx].payment_status !== 'Paid') {
      db.bills[billIdx] = {
        ...db.bills[billIdx],
        payment_status: status,
        updated_at: now,
      };
    }

    return paymentIdx !== -1
      ? { ...db.payments[paymentIdx] }
      : {
          id: db.nextPaymentId++,
          bill_id: billId,
          patient_name: db.bills[billIdx]?.patient_name || 'Patient',
          bill_description: db.bills[billIdx]?.description || 'Clinical Bill',
          razorpay_order_id: orderId,
          razorpay_payment_id: null,
          razorpay_signature: null,
          amount: db.bills[billIdx]?.total_amount || 0,
          payment_status: status,
          failure_reason: reason,
          created_at: now,
          updated_at: now,
        };
  },

  async getPayments(billId?: number): Promise<Payment[]> {
    await delay(120);
    let list = [...db.payments];
    if (billId) {
      list = list.filter((p) => p.bill_id === billId);
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
};
