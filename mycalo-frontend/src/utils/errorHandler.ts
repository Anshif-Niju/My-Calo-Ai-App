import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string;
  errors?: {
    message: string;
  }[];
}

export const getErrorMessage = (error: unknown, defaultMessage = "Something went wrong. Please try again."): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse;

    return data?.message || data?.errors?.[0]?.message || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return defaultMessage;
};

