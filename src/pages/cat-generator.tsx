import { Download, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { CatGenerator } from "../components/CatGenerator";
import { HellCat } from "../components/CatGenerator/HellCat";
import {
  accessories,
  colorSchemes,
  type CatConfig,
} from "../components/CatGenerator/types";
import SessionBoundary from "../components/SessionBoundary";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useCatGeneratorConfigQuery } from "../hooks/useCatGeneratorConfigQuery";
import { computeCatGeneratorEligibility } from "../server/db/catGeneratorConfig";
import { useUserDbData } from "../server/db/useUserStreak";
const Index = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const userEmail = session?.user?.email ?? "";
  const { data: userData, isLoading: isUserLoading } = useUserDbData(userEmail);
  const { data: config, isLoading: isConfigLoading } =
    useCatGeneratorConfigQuery();

  const streak = isUserLoading ? null : userData?.data?.responseStreak ?? 0;
  const eligibility = computeCatGeneratorEligibility({
    streak,
    userEmail,
    config: isConfigLoading ? undefined : config,
  });

  const [catConfig, setCatConfig] = useState<CatConfig>({
    hornStyle: "curved",
    eyeColor: "fire",
    flameIntensity: "medium",
    pose: "sitting",
    accessories: ["collar"],
    colorScheme: "classic",
    eyeGlow: 75,
    hornSize: 60,
    tailLength: 70,
    bodySize: 50,
    flameHeight: 50,
    wickedness: 60,
    markings: "none",
    expression: "neutral",
  });

  useEffect(() => {
    // Only redirect once we know the streak/config and have determined the user is ineligible.
    if (isConfigLoading) return;
    if (eligibility.streak === null) return;
    if (eligibility.canAccess) return;

    void router.replace("/thank-you");
  }, [eligibility.canAccess, eligibility.streak, isConfigLoading, router]);

  if (!eligibility.canAccess) {
    const remaining =
      eligibility.config.accessStreak - (eligibility.streak ?? 0);
    return (
      <SessionBoundary>
        <div className="bg-gradient-shadow flex min-h-screen items-center justify-center px-6 text-center">
          <div className="space-y-4">
            <p className="text-lg text-gray-200">
              {eligibility.streak === null
                ? "בודקים את הרצף שלך..."
                : isConfigLoading
                ? "בודקים את ההרשאות שלך..."
                : "מחולל החתולים עדיין נעול — מעבירים אותך לעמוד התודה..."}
            </p>
            {!isConfigLoading && eligibility.streak !== null && (
              <p className="text-sm text-gray-300">
                {`עוד ${Math.max(
                  remaining,
                  1
                )} דיווחים כדי לפתוח את מחולל החתולים 🐱‍👤`}
              </p>
            )}
            <Link href="/thank-you" className="text-hell-fire underline">
              חזרה לעמוד התודה
            </Link>
          </div>
        </div>
      </SessionBoundary>
    );
  }

  const generateRandomCat = () => {
    const hornStyles = ["curved", "straight", "twisted", "none"];
    const eyeColors = ["fire", "ember", "glow", "blood"];
    const flameIntensities = ["low", "medium", "high"];
    const poses = ["sitting", "standing", "crouching"];
    const markings = ["none", "stripes", "spots", "flames"];
    const expressions = ["neutral", "menacing", "playful", "sleepy"];

    const numberForAccessory = Math.random();

    setCatConfig({
      hornStyle: hornStyles[
        Math.floor(Math.random() * hornStyles.length)
      ] as any,
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)] as any,
      flameIntensity: flameIntensities[
        Math.floor(Math.random() * flameIntensities.length)
      ] as any,
      pose: poses[Math.floor(Math.random() * poses.length)] as any,
      accessories:
        numberForAccessory > 3 / 4
          ? accessories.slice(0, 2)
          : numberForAccessory > 2 / 4
          ? accessories.slice(0, 1)
          : numberForAccessory > 1 / 4
          ? accessories.slice(1)
          : [],
      colorScheme: colorSchemes[
        Math.floor(Math.random() * colorSchemes.length)
      ] as any,
      eyeGlow: Math.floor(Math.random() * 101),
      hornSize: Math.floor(Math.random() * 101),
      tailLength: Math.floor(Math.random() * 101),
      bodySize: Math.floor(Math.random() * 50) + 25, // 25-75 for reasonable sizes
      flameHeight: Math.floor(Math.random() * 101),
      wickedness: Math.floor(Math.random() * 101),
      markings: markings[Math.floor(Math.random() * markings.length)] as any,
      expression: expressions[
        Math.floor(Math.random() * expressions.length)
      ] as any,
    });

    toast("נוצר חתול חדש מהשאול! 🔥");
  };

  const isCustomizationLocked = !eligibility.canCustomize;
  const isExportLocked = !eligibility.canExport;

  const exportSVG = () => {
    if (isExportLocked) return;
    const svgElement = document.querySelector("#hell-cat-svg") as SVGElement;
    if (!svgElement) {
      toast.error("אין חתול לייצוא!");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `hellscore-cat-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);

    toast.success("הקמע יוצא בהצלחה! 🎵");
  };

  return (
    <SessionBoundary>
      <div dir="rtl" className="bg-gradient-shadow min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-hell-fire animate-glow-pulse mb-4 text-4xl font-bold">
              מחולל החתולים
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              צרו קמע חתולי דמוני למקהלת המטאל א-קפלה. מושלם כפרס על דיווחי
              נוכחות ועידוד חיובי!
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {/* Cat Preview */}
            <Card className="bg-card/50 border-hell-fire/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-hell-glow flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  הקמע החתולי שלך
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div className="bg-hell-shadow/30 w-full max-w-md rounded-lg p-8">
                  <HellCat config={catConfig} />
                </div>

                <div className="flex gap-4">
                  <Button
                    size="sm"
                    onClick={generateRandomCat}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    אקראי
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportSVG}
                    variant="secondary"
                    disabled={isExportLocked}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ייצוא SVG
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-card/50 border-hell-ember/30 text-center align-middle backdrop-blur">
              <CardHeader>
                <CardTitle className="text-hell-glow ">
                  התאימו את השד שלכם
                </CardTitle>
                {isCustomizationLocked && (
                  <CardDescription>
                    {`התאמה אישית נפתחת ברצף של ${eligibility.config.customizeStreak} דיווחים.`}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <CatGenerator
                  config={catConfig}
                  onChange={setCatConfig}
                  disabled={isCustomizationLocked}
                  rareTraitsEnabled={eligibility.canUseRareTraits}
                  dir="rtl"
                />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-muted-foreground mt-6 text-center">
            <p className="mt-2 text-sm">
              מי ייתן ורצפי הנוכחות שלכם יבערו לנצח 🔥
            </p>
          </div>
        </div>
      </div>
    </SessionBoundary>
  );
};

export default Index;
