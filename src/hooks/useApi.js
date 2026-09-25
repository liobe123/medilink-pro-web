import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Charge des donnees depuis l'API et expose { data, loading, error, reload, setData }.
 * Remplace le motif useEffect + cancelled + try/catch/finally qui etait
 * recopie dans chaque page. Les reponses arrivant apres le demontage du
 * composant (ou apres un nouvel appel) sont ignorees.
 */
export function useApi(fetcher, deps = [], { initialData = null, enabled = true } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const reload = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await run();
      if (id === requestId.current) setData(result);
      return result;
    } catch (err) {
      if (id === requestId.current) setError(err);
      return undefined;
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    if (enabled) reload();
    return () => { requestId.current++; };
  }, [reload, enabled]);

  return { data, loading, error, reload, setData };
}
