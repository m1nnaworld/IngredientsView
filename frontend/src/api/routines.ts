import {apiClient} from './client';
import {Routine} from '@/types';

export const routinesApi = {
  getRoutines: () => apiClient.get<Routine[]>('/routines'),
  getRoutine: (id: number) => apiClient.get<Routine>(`/routines/${id}`),
  createRoutine: (data: Partial<Routine>) =>
    apiClient.post<Routine>('/routines', data),
  updateRoutine: (id: number, data: Partial<Routine>) =>
    apiClient.patch<Routine>(`/routines/${id}`, data),
  deleteRoutine: (id: number) => apiClient.delete(`/routines/${id}`),
};
