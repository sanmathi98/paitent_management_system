import { ArrowRight, CreditCard, Users, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export function DashboardPage() {
  const { state, fetchDashboardSummary } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  const summary = state.billing.dashboardSummary;
  const loading = state.billing.loading && !summary;

  return (
    <Layout
      primaryAction={{
        label: 'Manage Patients',
        onClick: () => navigate('/patients'),
      }}
    >
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-display">
              Welcome back, {state.auth.user?.name || 'Doctor'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Clinical census and billing overview across registered patients.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Patient Registry</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/billing')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              <span>Open Billing</span>
            </button>
          </div>
        </div>

        {state.billing.error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{state.billing.error}</span>
          </div>
        )}

        {/* KPI Grid */}
        <section aria-label="Summary metrics">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                Total Patients
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {loading ? '—' : summary?.total_patients ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Active records in registry
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">Total Bills</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {loading ? '—' : summary?.total_bills ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Issued clinical invoices
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                Total Paid Amount
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                {loading
                  ? '—'
                  : formatCurrency(summary?.total_paid_amount ?? 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Verified Razorpay settlements
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-medium text-slate-500">
                Total Pending Amount
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-700 font-mono tabular-nums">
                {loading
                  ? '—'
                  : formatCurrency(summary?.total_pending_amount ?? 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Awaiting patient payment
              </p>
            </div>
          </div>
        </section>

        {/* Two-column split: Recently Added Patients & Recent Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Recently Added Patients */}
          <section className="bg-white border border-slate-200 rounded-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900 font-display">
                Recently Added Patients
              </h3>
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="h-10 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : !summary || summary.recently_added_patients.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-600">
                    No patients registered yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/patients')}
                    className="mt-3 px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                  >
                    Add First Patient
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-4 py-3">Age / Gender</th>
                      <th className="px-6 py-3 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.recently_added_patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-900">
                            {patient.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            #{patient.id} · {patient.phone_number}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 tabular-nums">
                          {patient.age} yrs · {patient.gender}
                        </td>
                        <td className="px-6 py-3.5 text-right text-xs text-slate-500 tabular-nums">
                          {formatDate(patient.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Recent Bills */}
          <section className="bg-white border border-slate-200 rounded-xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900 font-display">
                Recent Patient Bills
              </h3>
              <button
                type="button"
                onClick={() => navigate('/billing')}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="h-10 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : !summary || summary.recent_bills.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-600">
                    No billing records found.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/billing')}
                    className="mt-3 px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                  >
                    Create First Bill
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Bill & Patient</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.recent_bills.map((bill) => (
                      <tr
                        key={bill.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-900">
                            {bill.patient_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">
                            #{bill.id} · {bill.description}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono tabular-nums font-medium text-slate-900">
                          {formatCurrency(bill.total_amount)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="inline-flex justify-end">
                            <StatusBadge status={bill.payment_status} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
