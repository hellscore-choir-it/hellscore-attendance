import { Download, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const Index = () => {
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

    toast("New hellish feline generated! 🔥");
  };

  const exportSVG = () => {
    const svgElement = document.querySelector("#hell-cat-svg") as SVGElement;
    if (!svgElement) {
      toast.error("No cat to export!");
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

    toast.success("Hellish mascot exported! 🎵");
  };

  return (
    <SessionBoundary>
      <div
        style={{ direction: "ltr" }}
        className="bg-gradient-shadow min-h-screen"
      >
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-hell-fire animate-glow-pulse mb-4 text-4xl font-bold">
              Cat Mascot Generator
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Generate demonic feline mascots for your metal a cappella choir.
              Perfect for attendance tracking rewards and positive
              reinforcement!
            </p>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            {/* Cat Preview */}
            <Card className="bg-card/50 border-hell-fire/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-hell-glow flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Your Hellish Mascot
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
                    Random
                  </Button>
                  <Button size="sm" onClick={exportSVG} variant="secondary">
                    <Download className="mr-2 h-4 w-4" />
                    Export SVG
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-card/50 border-hell-ember/30 text-center align-middle backdrop-blur">
              <CardHeader>
                <CardTitle className="text-hell-glow ">
                  Customize Your Demon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CatGenerator config={catConfig} onChange={setCatConfig} />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-muted-foreground mt-6 text-center">
            <p>Created for Hellscore Metal A Cappella Choir</p>
            <p className="mt-2 text-sm">
              May your attendance streaks burn eternal 🔥
            </p>
          </div>
        </div>
      </div>
    </SessionBoundary>
  );
};

export default Index;
