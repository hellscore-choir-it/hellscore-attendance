import { captureException } from "@sentry/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { getServerAuthSession } from "../../../server/common/get-server-auth-session";
import { generateSupabaseUserId } from "../../../server/db/schema";
import { createClient } from "../../../utils/supabase/client";

const BodySchema = z.object({
  eventName: z.enum(["cta_impression", "cta_click"]),
  page: z.enum(["thank-you"]),
});

type Body = z.infer<typeof BodySchema>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).end();
  }

  const session = await getServerAuthSession({ req, res });
  const userEmail = session?.user?.email;

  if (!userEmail) {
    // Do not allow anonymous telemetry writes.
    return res.status(401).end();
  }

  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const body: Body = parsed.data;

  try {
    const supabase = createClient();
    const userId = generateSupabaseUserId(userEmail);

    const { error } = await supabase.from("cat_generator_telemetry").insert({
      user_id: userId,
      event_name: body.eventName,
      page: body.page,
      metadata: {},
    });

    if (error) {
      captureException(error, {
        extra: { eventName: body.eventName, page: body.page },
      });
    }
  } catch (error) {
    captureException(error, {
      extra: { eventName: body.eventName, page: body.page },
    });
  }

  // Telemetry is non-critical: always succeed.
  return res.status(204).end();
}
