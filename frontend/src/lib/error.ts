import { isAxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
};

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

