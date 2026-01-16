import { z } from "zod";

const CatTelemetryEventSchema = z.object({
  eventName: z.enum(["cta_impression", "cta_click"]),
  page: z.enum(["thank-you"]),
});

export type CatTelemetryEvent = z.infer<typeof CatTelemetryEventSchema>;

export async function logCatTelemetry(event: CatTelemetryEvent): Promise<void> {
  const parsed = CatTelemetryEventSchema.safeParse(event);
  if (!parsed.success) return;

  try {
    await fetch("/api/telemetry/cat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    // Telemetry is non-critical; never throw.
  }
}
