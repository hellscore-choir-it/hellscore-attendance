import { useUserDbData } from "../server/db/useUserStreak";
import { HellCat } from "./CatGenerator/HellCat";
import { generateRandomCat } from "./CatGenerator/helpers";

export const StreakTracker: React.FC<{ userEmail: string }> = ({
  userEmail,
}) => {
  const randomCat = generateRandomCat(userEmail || "default");
  const { data: userData, isLoading } = useUserDbData(userEmail);
  return (
    <>
      <p className="mt-2 text-center text-lg">
        {isLoading ? (
          "טוען..."
        ) : (
          <>
            דיווחת על{" "}
            <span className="text-hell-fire animate-glow-pulse">
              {userData?.data?.responseStreak}
            </span>{" "}
            חזרות רצופות
          </>
        )}
      </p>

      <HellCat config={randomCat} />
      <p className="text-hell-fire animate-glow-pulse text-center text-lg">
        הנה חתול שאול שנוצר במיוחד בשבילך!
      </p>
    </>
  );
};
