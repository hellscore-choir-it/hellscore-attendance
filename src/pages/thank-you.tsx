import { NextPage } from "next";

import { useSession } from "next-auth/react";
import { HellCat } from "../components/CatGenerator/HellCat";
import {
  generateRandomCat,
  hashSeed,
} from "../components/CatGenerator/helpers";
import Layout from "../components/Layout";

const ThankYou: NextPage = () => {
  const { data: session } = useSession();
  const randomCat = generateRandomCat(
    hashSeed(session?.user?.email || "default")
  );
  return (
    <Layout>
      {session ? (
        <>
          <h2 className="text-center text-xl">תודה ❤️</h2>
          <p className="mt-2 text-center text-sm">
            הנה חתול שאול שנוצר במיוחד בשבילך!
          </p>
          <HellCat config={randomCat} />
        </>
      ) : (
        <p>אנא התחבר/י 🙂</p>
      )}
    </Layout>
  );
};

export default ThankYou;
