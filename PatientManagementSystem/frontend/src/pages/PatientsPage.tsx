import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { Bill, Gender, Patient, PatientFormPayload } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const EMPTY_FORM: PatientFormPayload = {
  name: '',
  age: 30,
  gender: 'Male',
  phone_number: '',
  email: '',
  address: '',
};

export function PatientsPage() {
  const {
    state,
    fetchPatients,
    fetchBills,
    createPatient,
    updatePatient,
    deletePatient,
    clearPatientsError,
  } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<Gender | ''>('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [patientBills, setPatientBills] = useState<Bill[]>([]);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  const loadPatients = useCallback(() => {
    fetchPatients({
      search,
      gender: genderFilter,
      sort,
      page,
      page_size: 8,
    });
  }, [fetchPatients, search, genderFilter, sort, page]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const activeQuery = {
    search,
    gender: genderFilter,
    sort,
    page,
    page_size: 8,
  };

  const openAddModal = () => {
    setEditingPatient(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
    clearPatientsError();
    setFormOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone_number: patient.phone_number,
      email: patient.email,
      address: patient.address,
    });
    setFormError(null);
    setFieldErrors({});
    clearPatientsError();
    setFormOpen(true);
  };

  const openViewModal = async (patient: Patient) => {
    setViewingPatient(patient);
    await fetchBills({ patient_id: patient.id });
  };

  useEffect(() => {
    if (viewingPatient) {
      setPatientBills(
        state.billing.bills.filter((b) => b.patient_id === viewingPatient.id)
      );
    }
  }, [viewingPatient, state.billing.bills]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Patient name is required.';
    const ageNum = Number(formData.age);
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 130) {
      errors.age = 'Age must be between 0 and 130.';
    }
    if (!formData.phone_number.trim() || formData.phone_number.trim().length < 7) {
      errors.phone_number = 'Valid phone number is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Valid email address is required.';
    }
    if (!formData.address.trim()) {
      errors.address = 'Residential address is required.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateForm()) return;

    const payload: PatientFormPayload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone_number: formData.phone_number.trim(),
      address: formData.address.trim(),
      age: Number(formData.age),
    };

    const result = editingPatient
      ? await updatePatient(editingPatient.id, payload, activeQuery)
      : await createPatient(payload, activeQuery);

    if (result.ok) {
      setFormOpen(false);
    } else {
      setFormError(result.error || 'Failed to save patient record.');
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    const ok = await deletePatient(deletingPatient.id, activeQuery);
    if (ok) {
      setDeletingPatient(null);
      if (viewingPatient?.id === deletingPatient.id) {
        setViewingPatient(null);
      }
    }
  };

  return (
    <Layout
      primaryAction={{
        label: 'Add Patient',
        onClick: openAddModal,
      }}
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by patient name, email, or phone..."
              aria-label="Search patients"
              className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-teal-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Gender Segmented Filter */}
            <div
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              role="group"
              aria-label="Filter by gender"
            >
              {(['', 'Male', 'Female', 'Other'] as const).map((g) => (
                <button
                  key={g || 'All'}
                  type="button"
                  onClick={() => {
                    setGenderFilter(g);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    genderFilter === g
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g || 'All'}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value as 'newest' | 'oldest' | 'name_asc' | 'name_desc'
                )
              }
              aria-label="Sort patients"
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </div>
        </div>

        {state.patients.error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{state.patients.error}</span>
          </div>
        )}

        {/* Patients Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Patient Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {state.patients.count} total patients matching criteria
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Patient</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            {state.patients.loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((row) => (
                  <div
                    key={row}
                    className="h-11 bg-slate-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : state.patients.items.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No patients found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {search || genderFilter
                    ? 'Try clearing your search or gender filter.'
                    : 'Register your first patient to begin managing appointments and bills.'}
                </p>
                {!search && !genderFilter && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-4 px-4 py-2 text-xs font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800"
                  >
                    Add First Patient
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {state.patients.items.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-600 tabular-nums">
                        #{patient.id}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                        {patient.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 tabular-nums">
                        {patient.age}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {patient.gender}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-mono text-xs whitespace-nowrap">
                        {patient.phone_number}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        {patient.email}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap tabular-nums">
                        {formatDate(patient.created_at)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openViewModal(patient)}
                            title="View Patient Details"
                            aria-label={`View ${patient.name}`}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(patient)}
                            title="Edit Patient"
                            aria-label={`Edit ${patient.name}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPatient(patient)}
                            title="Delete Patient"
                            aria-label={`Delete ${patient.name}`}
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

          {/* Pagination Footer */}
          {state.patients.totalPages > 1 && (
            <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="tabular-nums">
                Page {state.patients.page} of {state.patients.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={page >= state.patients.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(state.patients.totalPages, p + 1))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-form-title"
        >
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3
                id="patient-form-title"
                className="text-base font-semibold text-slate-900 font-display"
              >
                {editingPatient ? 'Edit Patient Record' : 'Register New Patient'}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Close patient form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="p-6 space-y-4" noValidate>
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
                  htmlFor="patient-name"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Patient Name *
                </label>
                <input
                  id="patient-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full legal name"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="patient-age"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Age *
                  </label>
                  <input
                    id="patient-age"
                    type="number"
                    min={0}
                    max={130}
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        age: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 tabular-nums"
                  />
                  {fieldErrors.age && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.age}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="patient-gender"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Gender *
                  </label>
                  <select
                    id="patient-gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as Gender,
                      })
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="patient-phone"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="patient-phone"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    placeholder="+91 98000 00000"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                  {fieldErrors.phone_number && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.phone_number}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="patient-email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    id="patient-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="patient@example.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="patient-address"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Address *
                </label>
                <textarea
                  id="patient-address"
                  rows={2}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street, city, postal code"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600"
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state.patients.actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg disabled:opacity-50"
                >
                  {state.patients.actionLoading
                    ? 'Saving...'
                    : editingPatient
                      ? 'Save Changes'
                      : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Details View Modal */}
      {viewingPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="patient-details-title"
        >
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3
                  id="patient-details-title"
                  className="text-base font-semibold text-slate-900 font-display"
                >
                  {viewingPatient.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Patient ID #{viewingPatient.id} · Registered{' '}
                  {formatDate(viewingPatient.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPatient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Close patient details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Age & Gender</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {viewingPatient.age} years · {viewingPatient.gender}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone Number</p>
                  <p className="mt-1 font-mono text-slate-900">
                    {viewingPatient.phone_number}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="mt-1 text-slate-900 break-all">
                    {viewingPatient.email}
                  </p>
                </div>
                <div className="sm:col-span-3">
                  <p className="text-xs text-slate-500">Residential Address</p>
                  <p className="mt-1 text-slate-800">{viewingPatient.address}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Associated Bills
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingPatient(null);
                      navigate('/billing');
                    }}
                    className="text-xs font-medium text-teal-700 hover:text-teal-800"
                  >
                    Manage in Billing
                  </button>
                </div>

                {patientBills.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No bills recorded for this patient yet.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5">Bill ID</th>
                          <th className="px-4 py-2.5">Service</th>
                          <th className="px-4 py-2.5 text-right">Total</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {patientBills.map((b) => (
                          <tr key={b.id}>
                            <td className="px-4 py-2.5 font-mono text-slate-600">
                              #{b.id}
                            </td>
                            <td className="px-4 py-2.5 text-slate-900">
                              {b.description}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900">
                              {formatCurrency(b.total_amount)}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex justify-end">
                                <StatusBadge status={b.payment_status} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deletingPatient)}
        title="Delete Patient Record"
        message={
          deletingPatient
            ? `Are you sure you want to delete ${deletingPatient.name}? Any linked bills and payment records for this patient will also be removed.`
            : ''
        }
        confirmLabel="Delete Patient"
        loading={state.patients.actionLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPatient(null)}
      />
    </Layout>
  );
}
