import { useEffect, useRef, useState } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook genérico para invocar funciones async (de @/lib/api).
 *
 * Uso:
 *   const { data, loading, error } = useFetch(fetchDashboardKpis);
 *   const { data } = useFetch(() => fetchSolicitudByFolio(id), [id]);
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refetch: () => setTick((t) => t + 1) };
}
