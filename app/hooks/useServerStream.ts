"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface JointState {
  hits: number;
  length: number;
  lastHit: number;
  visitors: number;
}

const DEFAULT_STATE: JointState = { hits: 0, length: 1, lastHit: 0, visitors: 1 };

export function useServerStream() {
  const [state, setState] = useState<JointState>(DEFAULT_STATE);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as JointState;
        setState(data);
      } catch {
        // Ignore parse errors (e.g., comment lines)
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const hit = useCallback(async () => {
    try {
      const res = await fetch("/api/hit", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch {
      // Optimistic update on network failure
      setState((prev) => {
        const newLength = prev.length - 0.05;
        return {
          ...prev,
          hits: prev.hits + 1,
          length: newLength <= 0 ? 1 : newLength,
          lastHit: Date.now(),
        };
      });
    }
  }, []);

  return { state, connected, hit };
}
