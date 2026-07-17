import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";

export default function useApi(url, initialData = []) {
  const fallbackData = useRef(initialData);
  const controllerRef = useRef(null);
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(url, { signal: controller.signal });
      // A malformed or transitional response should never turn list/object state
      // into undefined and crash a page while authentication or HMR settles.
      setData(response.data?.data ?? fallbackData.current);
      setMeta(response.data?.meta ?? null);
    } catch (requestError) {
      if (requestError.code !== "ERR_CANCELED") setError(getErrorMessage(requestError));
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
  }, [reload]);
  return { data, setData, meta, loading, error, reload };
}
