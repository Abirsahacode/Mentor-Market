import { useCallback, useEffect, useRef, useState } from "react";
import api, { getErrorMessage } from "../api/axios.js";

export default function useApi(url, initialData = []) {
  const fallbackData = useRef(initialData);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(url);
      // A malformed or transitional response should never turn list/object state
      // into undefined and crash a page while authentication or HMR settles.
      setData(response.data?.data ?? fallbackData.current);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { reload(); }, [reload]);
  return { data, setData, loading, error, reload };
}
