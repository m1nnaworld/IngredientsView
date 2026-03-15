import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {routinesApi} from '@/api';
import {Routine} from '@/types';

export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: () => routinesApi.getRoutines().then(res => res.data),
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Routine>) =>
      routinesApi.createRoutine(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['routines']});
    },
  });
}
