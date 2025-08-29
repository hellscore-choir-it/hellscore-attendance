// Wrapper for unstable_getServerSession https://next-auth.js.org/configuration/nextjs

import type { GetServerSidePropsContext } from "next";
import { getServerSession, type DefaultSession } from "next-auth";

import { authOptions as nextAuthOptions } from "../../pages/api/auth/[...nextauth]";
import { calculateSHA256Hash } from "../../utils/sha265";

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
  if (baseSession?.user?.email) {
    // const add a sha256 encoded email for database operations
    baseSession.user.hashedEmail = calculateSHA256Hash(baseSession.user.email);
  }
  return baseSession;
};
