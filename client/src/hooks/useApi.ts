import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { axiosInstance } from "../config/axios";
import { AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import { showError } from "../utils/toast";

// Error message helper 
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    return (
      (data?.message as string) ||
      (data?.error as string) ||
      error.message ||
      "Request failed"
    );
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
};

// Generic query hook
export function useApiQuery<T = unknown>(
  key: string | string[],
  config: AxiosRequestConfig,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await axiosInstance(config);
      return response.data?.data ?? response.data;
    },
    retry: (failureCount, error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 401)
        return false;
      return failureCount < 3;
    },
    ...options,
  });
}

// Generic mutation hook
export function useApiMutation<T = unknown, TVariables = unknown>(
  config: AxiosRequestConfig,
  options?: UseMutationOptions<T, Error, TVariables>,
) {
  return useMutation<T, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const response = await axiosInstance({
        ...config,
        data: variables,
      });
      return response.data?.data ?? response.data;
    },
    ...options,
    onError: (error: Error, variables: TVariables, context: unknown) => {
      showError(getErrorMessage(error));
      options?.onError?.(error, variables, context);
    },
  });
}
