import { axiosClient } from './axiosClient';
import { sandboxStore } from './sandboxStore';
import {
  ApiMode,
  PaginatedResponse,
  Patient,
  PatientFormPayload,
  PatientQueryParams,
} from '../types';

export const patientApi = {
  async getPatients(
    params: PatientQueryParams,
    mode: ApiMode
  ): Promise<PaginatedResponse<Patient>> {
    if (mode === 'sandbox') {
      return sandboxStore.getPatients(params);
    }

    const response = await axiosClient.get('/patients/', { params });
    const raw = response.data?.data || response.data;
    if (Array.isArray(raw)) {
      return {
        count: raw.length,
        page: 1,
        page_size: raw.length || 10,
        total_pages: 1,
        results: raw,
      };
    }
    return raw;
  },

  async getAllPatientsSimple(mode: ApiMode): Promise<Patient[]> {
    if (mode === 'sandbox') {
      return sandboxStore.getAllPatientsUnpaginated();
    }
    const response = await axiosClient.get('/patients/', {
      params: { page_size: 200 },
    });
    const raw = response.data?.data || response.data;
    return Array.isArray(raw) ? raw : raw.results || [];
  },

  async getPatientById(id: number, mode: ApiMode): Promise<Patient> {
    if (mode === 'sandbox') {
      return sandboxStore.getPatientById(id);
    }
    const response = await axiosClient.get(`/patients/${id}/`);
    return response.data?.data || response.data;
  },

  async createPatient(
    payload: PatientFormPayload,
    mode: ApiMode
  ): Promise<Patient> {
    if (mode === 'sandbox') {
      return sandboxStore.createPatient(payload);
    }
    const response = await axiosClient.post('/patients/', payload);
    return response.data?.data || response.data;
  },

  async updatePatient(
    id: number,
    payload: PatientFormPayload,
    mode: ApiMode
  ): Promise<Patient> {
    if (mode === 'sandbox') {
      return sandboxStore.updatePatient(id, payload);
    }
    const response = await axiosClient.put(`/patients/${id}/`, payload);
    return response.data?.data || response.data;
  },

  async deletePatient(id: number, mode: ApiMode): Promise<void> {
    if (mode === 'sandbox') {
      return sandboxStore.deletePatient(id);
    }
    await axiosClient.delete(`/patients/${id}/`);
  },
};
