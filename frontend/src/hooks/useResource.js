import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
export default function useResource(path, { delay = 0, enabled = true } = {}) {
  const [result, setResult] = useState({
    data: null,
    error: "",
    loading: true,
    path: "",
  });
  const [version, setVersion] = useState(0);
  const generation = useRef(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const current = ++generation.current;
    if (!enabled) return;
    const controller = new AbortController();
    setResult((old) => ({ ...old, loading: true, error: "" }));
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(path, { signal: controller.signal });
        if (current === generation.current)
          setResult({ data, error: "", loading: false, path });
      } catch (error) {
        if (!controller.signal.aborted && current === generation.current)
          setResult({
            data: null,
            loading: false,
            path,
            error:
              error.response?.data?.message ||
              "Check your connection and try again.",
          });
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
      generation.current++;
    };
  }, [path, delay, enabled, version]);
  return {
    ...result,
    loading: enabled && (result.loading || result.path !== path),
    reload,
  };
}
