import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading and error states
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(...args);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, execute, clearError };
};

export default useApi;
