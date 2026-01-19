import type { GetServerSidePropsContext, NextApiRequest } from "next";

export const getE2EEmailFromApiRequest = (req: NextApiRequest) => {
  const raw = req.query.e2eEmail;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
};

export const getE2EEmailFromGSSPContext = (ctx: GetServerSidePropsContext) => {
  const raw = ctx.query.e2eEmail;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
};
