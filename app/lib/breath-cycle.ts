/**
 * Deterministic breath cycle from any timestamp.
 * Full cycle = 8 seconds (4s inhale, 4s exhale).
 * Returns a value 0..1 where 0 = fully exhaled, 1 = fully inhaled.
 */
export function getBreathPhase(timestampMs: number): number {
  const CYCLE_MS = 8000;
  const position = (timestampMs % CYCLE_MS) / CYCLE_MS; // 0..1 within cycle

  // First half = inhale (0→1), second half = exhale (1→0)
  if (position < 0.5) {
    return easeInOutSine(position * 2);
  }
  return easeInOutSine(1 - (position - 0.5) * 2);
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Calculate CSS animation-delay to sync a local CSS animation
 * with the global server clock.
 *
 * @param serverTimeMs - server's current timestamp in ms
 * @param localTimeMs - local timestamp when server time was fetched
 * @returns negative delay in ms to sync with server
 */
export function calcBreathDelay(serverTimeMs: number, localTimeMs: number): number {
  const CYCLE_MS = 8000;
  const offset = serverTimeMs - localTimeMs;
  const serverNow = Date.now() + offset;
  const phase = serverNow % CYCLE_MS;
  return -phase;
}
