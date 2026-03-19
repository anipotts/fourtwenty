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
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
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
    // Optimistic update — instant local feedback
    setState((prev) => {
      const newLength = prev.length - 0.05;
      return {
        ...prev,
        hits: prev.hits + 1,
        length: newLength <= 0.20 ? 1 : newLength,
        lastHit: Date.now(),
      };
    });

    // Fire-and-forget to server — SSE stream will reconcile
    try {
      await fetch("/api/hit", { method: "POST" });
    } catch {
      // Already updated optimistically, SSE will correct if needed
    }
  }, []);

  return { state, connected, hit };
}
