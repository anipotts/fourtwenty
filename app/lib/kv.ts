import { kv } from "@vercel/kv";

const KEYS = {
  hits: "fourtwenty:joint:hits",
  length: "fourtwenty:joint:length",
  lastHit: "fourtwenty:joint:lastHit",
  visitors: "fourtwenty:visitors:active",
} as const;

export interface JointState {
  hits: number;
  length: number;
  lastHit: number;
  visitors: number;
}

export async function getJointState(): Promise<JointState> {
  const [hits, length, lastHit] = await Promise.all([
    kv.get<number>(KEYS.hits),
    kv.get<number>(KEYS.length),
    kv.get<number>(KEYS.lastHit),
  ]);

  const visitors = await getVisitorCount();

  return {
    hits: hits ?? 0,
    length: length ?? 1,
    lastHit: lastHit ?? 0,
    visitors,
  };
}

export async function hitJoint(): Promise<JointState> {
  const currentLength = (await kv.get<number>(KEYS.length)) ?? 1;
  const newLength = currentLength - 0.05;

  if (newLength <= 0) {
    // Relight
    await Promise.all([
      kv.incr(KEYS.hits),
      kv.set(KEYS.length, 1),
      kv.set(KEYS.lastHit, Date.now()),
    ]);
  } else {
    await Promise.all([
      kv.incr(KEYS.hits),
      kv.set(KEYS.length, Math.round(newLength * 100) / 100),
      kv.set(KEYS.lastHit, Date.now()),
    ]);
  }

  return getJointState();
}

export async function registerVisitor(id: string): Promise<void> {
  // Score = current timestamp; entries expire via cleanup
  await kv.zadd(KEYS.visitors, { score: Date.now(), member: id });
}

export async function removeVisitor(id: string): Promise<void> {
  await kv.zrem(KEYS.visitors, id);
}

async function getVisitorCount(): Promise<number> {
  // Clean up entries older than 30 seconds
  const cutoff = Date.now() - 30_000;
  await kv.zremrangebyscore(KEYS.visitors, 0, cutoff);
  return (await kv.zcard(KEYS.visitors)) ?? 0;
}

export async function heartbeatVisitor(id: string): Promise<void> {
  await kv.zadd(KEYS.visitors, { score: Date.now(), member: id });
}
