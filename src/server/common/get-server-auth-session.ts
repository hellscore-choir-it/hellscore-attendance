// Wrapper for unstable_getServerSession https://next-auth.js.org/configuration/nextjs

import type { GetServerSidePropsContext } from "next";
import { getServerSession, type DefaultSession } from "next-auth";

import { authOptions as nextAuthOptions } from "../../pages/api/auth/[...nextauth]";

export interface SessionWithHashedEmail extends DefaultSession {
  user: DefaultSession["user"] & {
    hashedEmail?: string;
  };
}

// Next API route example - /pages/api/restricted.ts
export const getServerAuthSession = async (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  const baseSession: SessionWithHashedEmail | null = await getServerSession(
    ctx.req,
    ctx.res,
    nextAuthOptions
  );
  return baseSession;
};
