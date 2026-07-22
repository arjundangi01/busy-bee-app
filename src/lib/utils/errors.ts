import axios from "axios";

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

// Machine-readable error codes (e.g. SESSION_CAP_REACHED) live alongside
// `message` on error responses — see backend's AppError/ErrorResponse.
export const getErrorCode = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { code?: string } | undefined)?.code;
  }
  return undefined;
};
