import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { authApi } from '../api/authApi';
import {
  parseApiError,
  registerAuthCallbacks,
  setInMemoryTokens,
} from '../api/axiosClient';
import { billingApi } from '../api/billingApi';
import { patientApi } from '../api/patientApi';
import {
  ApiMode,
  AuthTokens,
  Bill,
  BillFormPayload,
  BillQueryParams,
  DashboardSummary,
  LoginPayload,
  Patient,
  PatientFormPayload,
  PatientQueryParams,
  Payment,
  RazorpayOrderResponse,
  RegisterPayload,
  User,
  VerifyPaymentPayload,
} from '../types';

interface AppState {
  apiMode: ApiMode;
  auth: {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  patients: {
    items: Patient[];
    allPatients: Patient[];
    selectedPatient: Patient | null;
    count: number;
    page: number;
    totalPages: number;
    loading: boolean;
    actionLoading: boolean;
    error: string | null;
  };
  billing: {
    bills: Bill[];
    payments: Payment[];
    dashboardSummary: DashboardSummary | null;
    selectedBill: Bill | null;
    loading: boolean;
    actionLoading: boolean;
    paymentLoading: boolean;
    error: string | null;
    paymentError: string | null;
  };
}

const initialState: AppState = {
  apiMode: 'sandbox',
  auth: {
    user: null,
    tokens: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  patients: {
    items: [],
    allPatients: [],
    selectedPatient: null,
    count: 0,
    page: 1,
    totalPages: 1,
    loading: false,
    actionLoading: false,
    error: null,
  },
  billing: {
    bills: [],
    payments: [],
    dashboardSummary: null,
    selectedBill: null,
    loading: false,
    actionLoading: false,
    paymentLoading: false,
    error: null,
    paymentError: null,
  },
};

type Action =
  | { type: 'SET_API_MODE'; payload: ApiMode }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_TOKENS_REFRESHED'; payload: AuthTokens }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_AUTH_ERROR' }
  | { type: 'PATIENTS_LOADING' }
  | {
      type: 'PATIENTS_LOADED';
      payload: { items: Patient[]; count: number; page: number; totalPages: number };
    }
  | { type: 'ALL_PATIENTS_LOADED'; payload: Patient[] }
  | { type: 'PATIENT_SELECTED'; payload: Patient | null }
  | { type: 'PATIENTS_ACTION_START' }
  | { type: 'PATIENTS_ACTION_DONE' }
  | { type: 'PATIENTS_ERROR'; payload: string }
  | { type: 'CLEAR_PATIENTS_ERROR' }
  | { type: 'BILLING_LOADING' }
  | { type: 'DASHBOARD_LOADED'; payload: DashboardSummary }
  | { type: 'BILLS_LOADED'; payload: Bill[] }
  | { type: 'PAYMENTS_LOADED'; payload: Payment[] }
  | { type: 'BILL_SELECTED'; payload: Bill | null }
  | { type: 'BILLING_ACTION_START' }
  | { type: 'BILLING_ACTION_DONE' }
  | { type: 'BILLING_ERROR'; payload: string }
  | { type: 'PAYMENT_START' }
  | { type: 'PAYMENT_SUCCESS' }
  | { type: 'PAYMENT_ERROR'; payload: string }
  | { type: 'CLEAR_BILLING_ERRORS' };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_API_MODE':
      return { ...state, apiMode: action.payload };
    case 'AUTH_START':
      return {
        ...state,
        auth: { ...state.auth, loading: true, error: null },
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        auth: {
          user: action.payload.user,
          tokens: action.payload.tokens,
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        auth: { ...state.auth, loading: false, error: action.payload },
      };
    case 'AUTH_TOKENS_REFRESHED':
      return {
        ...state,
        auth: { ...state.auth, tokens: action.payload },
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        apiMode: state.apiMode,
      };
    case 'CLEAR_AUTH_ERROR':
      return {
        ...state,
        auth: { ...state.auth, error: null },
      };
    case 'PATIENTS_LOADING':
      return {
        ...state,
        patients: { ...state.patients, loading: true, error: null },
      };
    case 'PATIENTS_LOADED':
      return {
        ...state,
        patients: {
          ...state.patients,
          items: action.payload.items,
          count: action.payload.count,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          loading: false,
          error: null,
        },
      };
    case 'ALL_PATIENTS_LOADED':
      return {
        ...state,
        patients: { ...state.patients, allPatients: action.payload },
      };
    case 'PATIENT_SELECTED':
      return {
        ...state,
        patients: { ...state.patients, selectedPatient: action.payload },
      };
    case 'PATIENTS_ACTION_START':
      return {
        ...state,
        patients: { ...state.patients, actionLoading: true, error: null },
      };
    case 'PATIENTS_ACTION_DONE':
      return {
        ...state,
        patients: { ...state.patients, actionLoading: false },
      };
    case 'PATIENTS_ERROR':
      return {
        ...state,
        patients: {
          ...state.patients,
          loading: false,
          actionLoading: false,
          error: action.payload,
        },
      };
    case 'CLEAR_PATIENTS_ERROR':
      return {
        ...state,
        patients: { ...state.patients, error: null },
      };
    case 'BILLING_LOADING':
      return {
        ...state,
        billing: { ...state.billing, loading: true, error: null },
      };
    case 'DASHBOARD_LOADED':
      return {
        ...state,
        billing: {
          ...state.billing,
          dashboardSummary: action.payload,
          loading: false,
          error: null,
        },
      };
    case 'BILLS_LOADED':
      return {
        ...state,
        billing: {
          ...state.billing,
          bills: action.payload,
          loading: false,
          error: null,
        },
      };
    case 'PAYMENTS_LOADED':
      return {
        ...state,
        billing: {
          ...state.billing,
          payments: action.payload,
          loading: false,
        },
      };
    case 'BILL_SELECTED':
      return {
        ...state,
        billing: { ...state.billing, selectedBill: action.payload },
      };
    case 'BILLING_ACTION_START':
      return {
        ...state,
        billing: { ...state.billing, actionLoading: true, error: null },
      };
    case 'BILLING_ACTION_DONE':
      return {
        ...state,
        billing: { ...state.billing, actionLoading: false },
      };
    case 'BILLING_ERROR':
      return {
        ...state,
        billing: {
          ...state.billing,
          loading: false,
          actionLoading: false,
          error: action.payload,
        },
      };
    case 'PAYMENT_START':
      return {
        ...state,
        billing: {
          ...state.billing,
          paymentLoading: true,
          paymentError: null,
        },
      };
    case 'PAYMENT_SUCCESS':
      return {
        ...state,
        billing: {
          ...state.billing,
          paymentLoading: false,
          paymentError: null,
        },
      };
    case 'PAYMENT_ERROR':
      return {
        ...state,
        billing: {
          ...state.billing,
          paymentLoading: false,
          paymentError: action.payload,
        },
      };
    case 'CLEAR_BILLING_ERRORS':
      return {
        ...state,
        billing: { ...state.billing, error: null, paymentError: null },
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  setApiMode: (mode: ApiMode) => void;
  login: (payload: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => void;
  clearAuthError: () => void;
  fetchPatients: (params?: PatientQueryParams) => Promise<void>;
  fetchAllPatientsSimple: () => Promise<Patient[]>;
  fetchPatientById: (id: number) => Promise<Patient | null>;
  createPatient: (
    payload: PatientFormPayload,
    activeQuery?: PatientQueryParams
  ) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  updatePatient: (
    id: number,
    payload: PatientFormPayload,
    activeQuery?: PatientQueryParams
  ) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  deletePatient: (
    id: number,
    activeQuery?: PatientQueryParams
  ) => Promise<boolean>;
  clearPatientsError: () => void;
  fetchDashboardSummary: () => Promise<void>;
  fetchBills: (params?: BillQueryParams) => Promise<void>;
  fetchPayments: (billId?: number) => Promise<void>;
  createBill: (
    payload: BillFormPayload,
    activeQuery?: BillQueryParams
  ) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  updateBill: (
    id: number,
    payload: BillFormPayload,
    activeQuery?: BillQueryParams
  ) => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>;
  deleteBill: (id: number, activeQuery?: BillQueryParams) => Promise<boolean>;
  createRazorpayOrder: (billId: number) => Promise<RazorpayOrderResponse | null>;
  verifyRazorpayPayment: (
    payload: VerifyPaymentPayload,
    activeQuery?: BillQueryParams
  ) => Promise<{ ok: boolean; payment?: Payment; error?: string }>;
  recordPaymentFailure: (
    billId: number,
    orderId: string,
    status: 'Failed' | 'Cancelled',
    reason: string,
    activeQuery?: BillQueryParams
  ) => Promise<void>;
  clearBillingErrors: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  useEffect(() => {
    registerAuthCallbacks(
      (access, refresh) => {
        dispatch({
          type: 'AUTH_TOKENS_REFRESHED',
          payload: { access, refresh },
        });
      },
      () => {
        logout();
      }
    );
  }, [logout]);

  const setApiMode = useCallback((mode: ApiMode) => {
    setInMemoryTokens(null, null);
    dispatch({ type: 'AUTH_LOGOUT' });
    dispatch({ type: 'SET_API_MODE', payload: mode });
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<boolean> => {
      dispatch({ type: 'AUTH_START' });
      try {
        const res = await authApi.login(payload, state.apiMode);
        dispatch({ type: 'AUTH_SUCCESS', payload: res });
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'AUTH_ERROR', payload: parsed.message });
        return false;
      }
    },
    [state.apiMode]
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<boolean> => {
      dispatch({ type: 'AUTH_START' });
      try {
        const res = await authApi.register(payload, state.apiMode);
        dispatch({ type: 'AUTH_SUCCESS', payload: res });
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'AUTH_ERROR', payload: parsed.message });
        return false;
      }
    },
    [state.apiMode]
  );

  const clearAuthError = useCallback(() => {
    dispatch({ type: 'CLEAR_AUTH_ERROR' });
  }, []);

  const fetchPatients = useCallback(
    async (params: PatientQueryParams = {}) => {
      dispatch({ type: 'PATIENTS_LOADING' });
      try {
        const res = await patientApi.getPatients(params, state.apiMode);
        dispatch({
          type: 'PATIENTS_LOADED',
          payload: {
            items: res.results,
            count: res.count,
            page: res.page,
            totalPages: res.total_pages,
          },
        });
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PATIENTS_ERROR', payload: parsed.message });
      }
    },
    [state.apiMode]
  );

  const fetchAllPatientsSimple = useCallback(async (): Promise<Patient[]> => {
    try {
      const list = await patientApi.getAllPatientsSimple(state.apiMode);
      dispatch({ type: 'ALL_PATIENTS_LOADED', payload: list });
      return list;
    } catch {
      return [];
    }
  }, [state.apiMode]);

  const fetchPatientById = useCallback(
    async (id: number): Promise<Patient | null> => {
      try {
        const patient = await patientApi.getPatientById(id, state.apiMode);
        dispatch({ type: 'PATIENT_SELECTED', payload: patient });
        return patient;
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PATIENTS_ERROR', payload: parsed.message });
        return null;
      }
    },
    [state.apiMode]
  );

  const createPatient = useCallback(
    async (
      payload: PatientFormPayload,
      activeQuery?: PatientQueryParams
    ): Promise<{
      ok: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    }> => {
      dispatch({ type: 'PATIENTS_ACTION_START' });
      try {
        await patientApi.createPatient(payload, state.apiMode);
        dispatch({ type: 'PATIENTS_ACTION_DONE' });
        await fetchPatients(activeQuery);
        return { ok: true };
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PATIENTS_ERROR', payload: parsed.message });
        return {
          ok: false,
          error: parsed.message,
          fieldErrors: parsed.fieldErrors,
        };
      }
    },
    [state.apiMode, fetchPatients]
  );

  const updatePatient = useCallback(
    async (
      id: number,
      payload: PatientFormPayload,
      activeQuery?: PatientQueryParams
    ): Promise<{
      ok: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    }> => {
      dispatch({ type: 'PATIENTS_ACTION_START' });
      try {
        await patientApi.updatePatient(id, payload, state.apiMode);
        dispatch({ type: 'PATIENTS_ACTION_DONE' });
        await fetchPatients(activeQuery);
        return { ok: true };
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PATIENTS_ERROR', payload: parsed.message });
        return {
          ok: false,
          error: parsed.message,
          fieldErrors: parsed.fieldErrors,
        };
      }
    },
    [state.apiMode, fetchPatients]
  );

  const deletePatient = useCallback(
    async (id: number, activeQuery?: PatientQueryParams): Promise<boolean> => {
      dispatch({ type: 'PATIENTS_ACTION_START' });
      try {
        await patientApi.deletePatient(id, state.apiMode);
        dispatch({ type: 'PATIENTS_ACTION_DONE' });
        await fetchPatients(activeQuery);
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PATIENTS_ERROR', payload: parsed.message });
        return false;
      }
    },
    [state.apiMode, fetchPatients]
  );

  const clearPatientsError = useCallback(() => {
    dispatch({ type: 'CLEAR_PATIENTS_ERROR' });
  }, []);

  const fetchDashboardSummary = useCallback(async () => {
    dispatch({ type: 'BILLING_LOADING' });
    try {
      const summary = await billingApi.getDashboardSummary(state.apiMode);
      dispatch({ type: 'DASHBOARD_LOADED', payload: summary });
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: 'BILLING_ERROR', payload: parsed.message });
    }
  }, [state.apiMode]);

  const fetchBills = useCallback(
    async (params: BillQueryParams = {}) => {
      dispatch({ type: 'BILLING_LOADING' });
      try {
        const bills = await billingApi.getBills(params, state.apiMode);
        dispatch({ type: 'BILLS_LOADED', payload: bills });
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'BILLING_ERROR', payload: parsed.message });
      }
    },
    [state.apiMode]
  );

  const fetchPayments = useCallback(
    async (billId?: number) => {
      try {
        const payments = await billingApi.getPayments(state.apiMode, billId);
        dispatch({ type: 'PAYMENTS_LOADED', payload: payments });
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'BILLING_ERROR', payload: parsed.message });
      }
    },
    [state.apiMode]
  );

  const createBill = useCallback(
    async (
      payload: BillFormPayload,
      activeQuery?: BillQueryParams
    ): Promise<{
      ok: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    }> => {
      dispatch({ type: 'BILLING_ACTION_START' });
      try {
        await billingApi.createBill(payload, state.apiMode);
        dispatch({ type: 'BILLING_ACTION_DONE' });
        await fetchBills(activeQuery);
        return { ok: true };
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'BILLING_ERROR', payload: parsed.message });
        return {
          ok: false,
          error: parsed.message,
          fieldErrors: parsed.fieldErrors,
        };
      }
    },
    [state.apiMode, fetchBills]
  );

  const updateBill = useCallback(
    async (
      id: number,
      payload: BillFormPayload,
      activeQuery?: BillQueryParams
    ): Promise<{
      ok: boolean;
      error?: string;
      fieldErrors?: Record<string, string>;
    }> => {
      dispatch({ type: 'BILLING_ACTION_START' });
      try {
        await billingApi.updateBill(id, payload, state.apiMode);
        dispatch({ type: 'BILLING_ACTION_DONE' });
        await fetchBills(activeQuery);
        return { ok: true };
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'BILLING_ERROR', payload: parsed.message });
        return {
          ok: false,
          error: parsed.message,
          fieldErrors: parsed.fieldErrors,
        };
      }
    },
    [state.apiMode, fetchBills]
  );

  const deleteBill = useCallback(
    async (id: number, activeQuery?: BillQueryParams): Promise<boolean> => {
      dispatch({ type: 'BILLING_ACTION_START' });
      try {
        await billingApi.deleteBill(id, state.apiMode);
        dispatch({ type: 'BILLING_ACTION_DONE' });
        await Promise.all([fetchBills(activeQuery), fetchPayments()]);
        return true;
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'BILLING_ERROR', payload: parsed.message });
        return false;
      }
    },
    [state.apiMode, fetchBills, fetchPayments]
  );

  const createRazorpayOrder = useCallback(
    async (billId: number): Promise<RazorpayOrderResponse | null> => {
      dispatch({ type: 'PAYMENT_START' });
      try {
        const order = await billingApi.createRazorpayOrder(
          billId,
          state.apiMode
        );
        dispatch({ type: 'PAYMENT_SUCCESS' });
        return order;
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PAYMENT_ERROR', payload: parsed.message });
        return null;
      }
    },
    [state.apiMode]
  );

  const verifyRazorpayPayment = useCallback(
    async (
      payload: VerifyPaymentPayload,
      activeQuery?: BillQueryParams
    ): Promise<{ ok: boolean; payment?: Payment; error?: string }> => {
      dispatch({ type: 'PAYMENT_START' });
      try {
        const payment = await billingApi.verifyRazorpayPayment(
          payload,
          state.apiMode
        );
        dispatch({ type: 'PAYMENT_SUCCESS' });
        await Promise.all([fetchBills(activeQuery), fetchPayments()]);
        return { ok: true, payment };
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PAYMENT_ERROR', payload: parsed.message });
        await Promise.all([fetchBills(activeQuery), fetchPayments()]);
        return { ok: false, error: parsed.message };
      }
    },
    [state.apiMode, fetchBills, fetchPayments]
  );

  const recordPaymentFailure = useCallback(
    async (
      billId: number,
      orderId: string,
      status: 'Failed' | 'Cancelled',
      reason: string,
      activeQuery?: BillQueryParams
    ) => {
      try {
        await billingApi.recordPaymentFailure(
          billId,
          orderId,
          status,
          reason,
          state.apiMode
        );
        dispatch({ type: 'PAYMENT_ERROR', payload: reason });
        await Promise.all([fetchBills(activeQuery), fetchPayments()]);
      } catch (err) {
        const parsed = parseApiError(err);
        dispatch({ type: 'PAYMENT_ERROR', payload: parsed.message });
      }
    },
    [state.apiMode, fetchBills, fetchPayments]
  );

  const clearBillingErrors = useCallback(() => {
    dispatch({ type: 'CLEAR_BILLING_ERRORS' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setApiMode,
        login,
        register,
        logout,
        clearAuthError,
        fetchPatients,
        fetchAllPatientsSimple,
        fetchPatientById,
        createPatient,
        updatePatient,
        deletePatient,
        clearPatientsError,
        fetchDashboardSummary,
        fetchBills,
        fetchPayments,
        createBill,
        updateBill,
        deleteBill,
        createRazorpayOrder,
        verifyRazorpayPayment,
        recordPaymentFailure,
        clearBillingErrors,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
