import { map } from "lodash";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const bottomLinks = [
    {
      label: "דיווח נוכחות",
      route: "/",
    },
    {
      label: "קטלוגסקור",
      route: "/catalog",
    },
  ];

  return (
    <div className="flex max-h-screen min-h-screen flex-col">
      <Head>
        <title>Hellscore Attendance</title>
        <meta name="description" content="Hellscore attendance" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>❤️‍🔥</text></svg>"
        />
      </Head>
      <div className="flex h-full flex-col p-4" dir="rtl">
        <header className="flex flex-shrink-0 content-center justify-between gap-3 border-b pb-1 align-middle">
          <h1
            className="text-hell-fire animate-glow-pulse text-2xl font-bold leading-normal"
            style={{
              textShadow:
                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
            }}
          >
            גיהנוכחות הלסקור 🔥😈
          </h1>
          <button
            className={
              session ? "btn btn-sm text-red-700" : "btn text-green-500"
            }
            onClick={session ? () => signOut() : () => signIn("google")}
          >
            {session ? "התנתק/י" : "התחבר/י"}
          </button>
        </header>
        <main className="flex-1 overflow-auto py-3">{children}</main>
        <footer
          className="flex flex-shrink-0 flex-col border-t pt-6 text-center text-sm text-gray-500"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mb-3">
            {map(bottomLinks, (linkDetails, index) => (
              <React.Fragment key={linkDetails.route}>
                {index > 0 && " | "}
                <button
                  className={`underline ${
                    router.pathname !== linkDetails.route
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500"
                  }`}
                  onClick={() => router.push(linkDetails.route)}
                  disabled={router.pathname === linkDetails.route}
                >
                  {linkDetails.label}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div>&copy; {new Date().getFullYear()} Hellscore Attendance</div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
