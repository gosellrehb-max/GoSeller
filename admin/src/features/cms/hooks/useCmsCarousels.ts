'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cmsApi } from '@/features/cms/services/cmsApi';
import type { CmsCreateCarouselInput, CmsUpdateCarouselInput } from '@/features/cms/types/cms';

export const CMS_CAROUSELS_QUERY_KEY = ['cms', 'carousels'] as const;

export function useCmsCarousels(enabled = true) {
  return useQuery({
    queryKey: CMS_CAROUSELS_QUERY_KEY,
    queryFn: cmsApi.getCarousels,
    staleTime: 30_000,
    enabled,
  });
}

export function useCreateCmsCarousel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CmsCreateCarouselInput) => cmsApi.createCarousel(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CMS_CAROUSELS_QUERY_KEY });
    },
  });
}

export function useUpdateCmsCarousel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CmsUpdateCarouselInput }) =>
      cmsApi.updateCarousel(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CMS_CAROUSELS_QUERY_KEY });
    },
  });
}

export function useDeleteCmsCarousel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cmsApi.deleteCarousel(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CMS_CAROUSELS_QUERY_KEY });
    },
  });
}
