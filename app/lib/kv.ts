import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Consolidated state in a single HASH — cheaper Upstash calls and atomic updates
const STATE_KEY = "fourtwenty:joint";
const VISITORS_KEY = "fourtwenty:visitors:active";

export const CYCLE_SIZE = 420;
export const FILTER_LINE = 0.2;
export const ROLL_DURATION_MS = 2200;

export type JointPhase = "unlit" | "lit" | "roach" | "rolling";

export interface JointState {
  hits: number;
  length: number;
  lastHit: number;
  phase: JointPhase;
  rollingStartedAt: number;
  visitors: number;
}

export interface HitResult extends JointState {
  triggeredRolling: boolean;
}

// Atomic hit script — single round-trip, no TOCTOU race at 420 milestone.
// Args: now_ms, cycle_size, filter_line
// Returns array of strings: [hits, length, lastHit, phase, rollingStartedAt, triggeredRolling]
const HIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local cycle_size = tonumber(ARGV[2])
local filter_line = tonumber(ARGV[3])

local state = redis.call('HMGET', key, 'hits', 'length', 'phase', 'rollingStartedAt')
local hits = tonumber(state[1]) or 0
local length = tonumber(state[2]) or 1.0
local phase = state[3] or 'unlit'
local rollingStartedAt = tonumber(state[4]) or 0

local triggered = 0

-- Ignore hits while rolling animation is playing
if phase == 'rolling' then
  return {tostring(hits), tostring(length), tostring(now), phase, tostring(rollingStartedAt), '0'}
end

hits = hits + 1

if phase == 'unlit' then
  -- First hit lights the joint
  phase = 'lit'
elseif phase == 'lit' then
  -- Exponential / accelerating burn: slower at start, faster near filter
  local decrement = 0.001 + 0.01 * (1 - length)
  length = length - decrement
  if length <= filter_line then
    length = filter_line
    phase = 'roach'
  end
end
-- 'roach' phase: no length change, just accumulate hits

-- Every 420th hit triggers the rolling animation
if hits % cycle_size == 0 then
  phase = 'rolling'
  rollingStartedAt = now
  triggered = 1
end

redis.call('HMSET', key,
  'hits', hits,
  'length', length,
  'lastHit', now,
  'phase', phase,
  'rollingStartedAt', rollingStartedAt
)

return {tostring(hits), tostring(length), tostring(now), phase, tostring(rollingStartedAt), tostring(triggered)}
`;

function parseRaw(raw: Record<string, unknown> | null): {
  hits: number;
  length: number;
  lastHit: number;
  phase: JointPhase;
  rollingStartedAt: number;
} {
  const hits = Number(raw?.hits ?? 0) || 0;
  const length = Number(raw?.length ?? 1.0);
  const lastHit = Number(raw?.lastHit ?? 0) || 0;
  const rawPhase = String(raw?.phase ?? "unlit") as JointPhase;
  const phase: JointPhase = (["unlit", "lit", "roach", "rolling"] as const).includes(rawPhase)
    ? rawPhase
    : "unlit";
  const rollingStartedAt = Number(raw?.rollingStartedAt ?? 0) || 0;
  return { hits, length, lastHit, phase, rollingStartedAt };
}

export async function getJointState(): Promise<JointState> {
  const now = Date.now();
  const raw = await redis.hgetall<Record<string, unknown>>(STATE_KEY);
  let { hits, length, lastHit, phase, rollingStartedAt } = parseRaw(raw);

  // Auto-transition rolling → unlit once the animation duration has elapsed.
  // Happens here so polling clients see the transition without needing a hit.
  if (phase === "rolling" && now - rollingStartedAt > ROLL_DURATION_MS) {
    phase = "unlit";
    length = 1.0;
    rollingStartedAt = 0;
    await redis.hset(STATE_KEY, {
      phase,
      length,
      rollingStartedAt,
    });
  }

  const visitors = await getVisitorCount();

  return { hits, length, lastHit, phase, rollingStartedAt, visitors };
}

export async function hitJoint(): Promise<HitResult> {
  const now = Date.now();
  const result = (await redis.eval(
    HIT_SCRIPT,
    [STATE_KEY],
    [String(now), String(CYCLE_SIZE), String(FILTER_LINE)]
  )) as [string, string, string, string, string, string];

  const visitors = await getVisitorCount();

  return {
    hits: parseInt(result[0], 10) || 0,
    length: parseFloat(result[1]),
    lastHit: parseInt(result[2], 10) || 0,
    phase: result[3] as JointPhase,
    rollingStartedAt: parseInt(result[4], 10) || 0,
    triggeredRolling: result[5] === "1",
    visitors,
  };
}

export async function registerVisitor(id: string): Promise<void> {
  await redis.zadd(VISITORS_KEY, { score: Date.now(), member: id });
}

export async function removeVisitor(id: string): Promise<void> {
  await redis.zrem(VISITORS_KEY, id);
}

async function getVisitorCount(): Promise<number> {
  const cutoff = Date.now() - 30_000;
  await redis.zremrangebyscore(VISITORS_KEY, 0, cutoff);
  return (await redis.zcard(VISITORS_KEY)) ?? 0;
}

export async function heartbeatVisitor(id: string): Promise<void> {
  await redis.zadd(VISITORS_KEY, { score: Date.now(), member: id });
}
