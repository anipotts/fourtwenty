import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

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
    redis.get<number>(KEYS.hits),
    redis.get<number>(KEYS.length),
    redis.get<number>(KEYS.lastHit),
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
  const currentLength = (await redis.get<number>(KEYS.length)) ?? 1;
  const newLength = currentLength - 0.05;

  if (newLength <= 0) {
    await Promise.all([
      redis.incr(KEYS.hits),
      redis.set(KEYS.length, 1),
      redis.set(KEYS.lastHit, Date.now()),
    ]);
  } else {
    await Promise.all([
      redis.incr(KEYS.hits),
      redis.set(KEYS.length, Math.round(newLength * 100) / 100),
      redis.set(KEYS.lastHit, Date.now()),
    ]);
  }

  return getJointState();
}

export async function registerVisitor(id: string): Promise<void> {
  await redis.zadd(KEYS.visitors, { score: Date.now(), member: id });
}

export async function removeVisitor(id: string): Promise<void> {
  await redis.zrem(KEYS.visitors, id);
}

async function getVisitorCount(): Promise<number> {
  const cutoff = Date.now() - 30_000;
  await redis.zremrangebyscore(KEYS.visitors, 0, cutoff);
  return (await redis.zcard(KEYS.visitors)) ?? 0;
}

export async function heartbeatVisitor(id: string): Promise<void> {
  await redis.zadd(KEYS.visitors, { score: Date.now(), member: id });
}
