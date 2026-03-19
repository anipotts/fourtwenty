import { getJointState, registerVisitor, removeVisitor, heartbeatVisitor } from "../../lib/kv";

export const dynamic = "force-dynamic";

export async function GET() {
  const visitorId = crypto.randomUUID();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      await registerVisitor(visitorId);

      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const state = await getJointState();
        send(state);
      } catch {
        send({ hits: 0, length: 1, lastHit: 0, visitors: 1 });
      }

      const interval = setInterval(async () => {
        try {
          await heartbeatVisitor(visitorId);
          const state = await getJointState();
          send(state);
        } catch {
          // continue on transient errors
        }
      }, 750);

      (controller as unknown as Record<string, () => Promise<void>>)._cleanup = async () => {
        clearInterval(interval);
        try { await removeVisitor(visitorId); } catch { /* best effort */ }
      };

      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    async cancel() {
      await removeVisitor(visitorId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
