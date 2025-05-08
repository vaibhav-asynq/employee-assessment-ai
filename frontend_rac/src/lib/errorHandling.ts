import { AxiosError } from "axios";

/**
 * Extracts a user-friendly error message from an Axios error
 * @param error Any error object, expected to be an AxiosError
 * @returns A formatted error message string
 */
export const getAxiosErrorMessage = (error: unknown): string => {
  // HANDLE AXIOS ERRORS
  if (error instanceof AxiosError) {
    // If the server returned a response with an error message
    if (error.response?.data) {
      const data = error.response.data;

      // Handle structured error responses
      if (typeof data === "object" && data !== null) {
        if ("message" in data) return data.message as string;
        if ("error" in data) return data.error as string;
        if ("detail" in data) return data.detail as string;
      }

      // If data is a string, return it directly
      if (typeof data === "string") return data;
    }

    // If we have a status code, include it in the error message
    if (error.response?.status) {
      return `Server error (${error.response.status}): ${error.message}`;
    }

    // Network errors or other Axios errors
    if (error.message) {
      if (error.message === "Network Error") {
        return "Network error: Unable to connect to the server. Please check your internet connection.";
      }
      return error.message;
    }
  }

  // HANDLE NON-AXIOS ERRORS
  if (error instanceof Error) {
    return error.message;
  }

  // FALLBACK FOR UNKNOWN ERROR TYPES
  return "An unknown error occurred";
};

/**
 * Handles any error by extracting a user-friendly message and optionally logging it
 * @param error Any error object
 * @param logError Whether to log the error to console (default: true)
 * @returns A formatted error message string
 */
export const handleError = (error: unknown, logError = true): string => {
  if (logError) {
    console.error("Error occurred:", error);
  }

  return getAxiosErrorMessage(error);
};
