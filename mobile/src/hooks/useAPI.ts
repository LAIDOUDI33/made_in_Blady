import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface UseAPIOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface UseAPIReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: any;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useAPI<T>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseAPIOptions<T> = {}
): UseAPIReturn<T> {
  const { immediate = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await apiFunction(...args);
        setData(result);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (err) {
        setError(err);
        
        if (onError) {
          onError(err);
        }
        
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Execute immediately on mount if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
  };
}

// Hook for fetching data with caching
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): UseAPIReturn<T> {
  return useAPI(fetchFn, { immediate: true });
}

// Hook for paginated data
export function usePaginatedData<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; total: number; page: number }>
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      const result = await fetchFn(page + 1);
      
      setData((prev) => [...prev, ...result.data]);
      setTotal(result.total);
      setPage(result.page);
      setHasMore(data.length < result.total);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, data.length, hasMore, isLoading]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchFn(1);
      
      setData(result.data);
      setTotal(result.total);
      setPage(1);
      setHasMore(result.data.length < result.total);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  return {
    data,
    total,
    page,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

// Hook for form submission
export function useFormSubmit<T>(
  submitFn: (data: T) => Promise<any>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async (data: T): Promise<boolean> => {
      try {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        await submitFn(data);
        
        setSuccess(true);
        return true;
      } catch (err) {
        setError(err);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFn]
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isSubmitting,
    error,
    success,
    submit,
    reset,
  };
}

export default useAPI;
