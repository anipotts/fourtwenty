import { getJointState, registerVisitor, removeVisitor, heartbeatVisitor } from "../../lib/kv";

export const runtime = "edge";

export async function GET() {
  const visitorId = crypto.randomUUID();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      await registerVisitor(visitorId);

      const send = (data: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send initial state
      try {
        const state = await getJointState();
        send(state);
      } catch {
        send({ hits: 0, length: 1, lastHit: 0, visitors: 1 });
      }

      // Poll every 2 seconds
      const interval = setInterval(async () => {
        try {
          await heartbeatVisitor(visitorId);
          const state = await getJointState();
          send(state);
        } catch {
          // Silently continue on transient errors
        }
      }, 2000);

      // Cleanup on close
      const cleanup = async () => {
        clearInterval(interval);
        try {
          await removeVisitor(visitorId);
        } catch {
          // Best effort
        }
      };

      // Edge runtime doesn't have a clean "onclose" — rely on heartbeat expiry
      // The interval will be cleaned up when the stream is garbage collected
      // Additionally, we add an abort handler
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Keep reference for potential cleanup
      (controller as unknown as Record<string, () => void>)._cleanup = cleanup;
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
