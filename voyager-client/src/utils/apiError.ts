export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as {
      response?: { data?: { message?: string; title?: string; errors?: Record<string, string[] | string> } };
      message?: string;
    }).response;

    if (response?.data?.message) {
      return response.data.message;
    }

    const validationErrors = response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstEntry = Object.values(validationErrors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }

      if (typeof firstEntry === 'string' && firstEntry.trim()) {
        return firstEntry;
      }
    }

    if (response?.data?.title) {
      return response.data.title;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
