"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type JointPhase = "unlit" | "lit" | "roach" | "rolling";

interface JointState {
  hits: number;
  length: number;
  lastHit: number;
  visitors: number;
  phase: JointPhase;
  rollingStartedAt: number;
}

const DEFAULT_STATE: JointState = {
  hits: 0,
  length: 1,
  lastHit: 0,
  visitors: 1,
  phase: "unlit",
  rollingStartedAt: 0,
};

// Back-compat: if the server payload is missing phase (e.g. mid-deploy), infer one
function normalize(raw: Partial<JointState>): JointState {
  const phase: JointPhase =
    raw.phase ?? (raw.length !== undefined && raw.length <= 0.2 ? "roach" : "lit");
  return {
    hits: raw.hits ?? 0,
    length: raw.length ?? 1,
    lastHit: raw.lastHit ?? 0,
    visitors: raw.visitors ?? 1,
    phase,
    rollingStartedAt: raw.rollingStartedAt ?? 0,
  };
}

export function useServerStream(onRollingTriggered?: () => void) {
  const [state, setState] = useState<JointState>(DEFAULT_STATE);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const rollingCallbackRef = useRef(onRollingTriggered);
  rollingCallbackRef.current = onRollingTriggered;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<JointState>;
        setState(normalize(data));
      } catch {
        // ignore parse errors
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
    // Narrow optimistic updates: only the transitions we can predict from a single hit
    setState((prev) => {
      // Ignore hits while rolling (matches server)
      if (prev.phase === "rolling") return prev;

      if (prev.phase === "unlit") {
        return { ...prev, phase: "lit", hits: prev.hits + 1, lastHit: Date.now() };
      }

      if (prev.phase === "lit") {
        // Same exponential formula as server
        const decrement = 0.001 + 0.01 * (1 - prev.length);
        const newLength = Math.max(0.2, prev.length - decrement);
        return {
          ...prev,
          hits: prev.hits + 1,
          length: newLength,
          lastHit: Date.now(),
        };
      }

      // roach: just bump the count locally
      return { ...prev, hits: prev.hits + 1, lastHit: Date.now() };
    });

    try {
      const res = await fetch("/api/hit", { method: "POST" });
      if (res.ok) {
        const data = (await res.json()) as Partial<JointState> & { triggeredRolling?: boolean };
        setState(normalize(data));
        if (data.triggeredRolling) {
          rollingCallbackRef.current?.();
        }
      }
    } catch {
      // Already applied optimistically; SSE will reconcile.
    }
  }, []);

  return { state, connected, hit };
}
