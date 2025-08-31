// src/pages/_app.tsx
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import type { AppProps, AppType } from "next/app";
import { SnackbarProvider } from "notistack";

import "../styles/globals.css";
import { trpc } from "../utils/trpc";

export interface MyAppProps extends AppProps {
  session: Session | null;
}

const MyApp: AppType<MyAppProps> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
        <Component {...pageProps} />
      </SnackbarProvider>
    </SessionProvider>
  );
};

export default trpc.withTRPC(MyApp);
