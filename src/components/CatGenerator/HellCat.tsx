import { includes } from "lodash";
import { useMemo } from "react";
import { colorSchemeDetails, type CatConfig } from "./types";

interface HellCatProps {
  config: CatConfig;
}

export const HellCat = ({ config }: HellCatProps) => {
  const catFeatures = useMemo(() => {
    const scheme = colorSchemeDetails[config.colorScheme];

    return {
      body: scheme.body,
      accent: scheme.accent,
      eyes: scheme.eyes,
      hornStyle: config.hornStyle,
      pose: config.pose,
      bodyScale: 0.7 + config.bodySize / 150, // Scale factor based on body size
      hornScale: 0.05 + config.hornSize / 80, // Scale factor for horns
      tailScale: 0.5 + config.tailLength / 100, // Scale factor for tail
      eyeGlowIntensity: config.eyeGlow / 100,
      wickednessLevel: config.wickedness / 100,
    };
  }, [config]);

  const getEyeShape = () => {
    switch (config.expression) {
      case "menacing":
        return { rx: 10, ry: 8, pupils: { rx: 4, ry: 6 } };
      case "playful":
        return { rx: 12, ry: 15, pupils: { rx: 3, ry: 10 } };
      case "sleepy":
        return { rx: 8, ry: 4, pupils: { rx: 2, ry: 2 } };
      default:
        return { rx: 8, ry: 12, pupils: { rx: 3, ry: 8 } };
    }
  };

  const getMouthCurve = () => {
    const wickedness = catFeatures.wickednessLevel;
    switch (config.expression) {
      case "menacing":
        return `M200,135 Q${190 - wickedness * 5},${145 + wickedness * 3} ${
          185 - wickedness * 2
        },140 M200,135 Q${210 + wickedness * 5},${145 + wickedness * 3} ${
          215 + wickedness * 2
        },140`;
      case "playful":
        return `M200,135 Q190,${140 - wickedness * 2} 185,135 M200,135 Q210,${
          140 - wickedness * 2
        } 215,135`;
      case "sleepy":
        return `M200,135 Q190,143 185,142 M200,135 Q210,143 215,142`;
      default:
        return `M200,135 Q190,145 185,140 M200,135 Q210,145 215,140`;
    }
  };

  const renderHorns = () => {
    if (config.hornStyle === "none") return null;

    const scale = catFeatures.hornScale;
    const baseSize = 40 * scale;

    const hornPaths = {
      curved: `M165,85 Q${140 - baseSize * 0.1},${70 - baseSize * 0.3} ${
        135 - baseSize * 0.1
      },${60 - baseSize * 0.4} Q${130 - baseSize * 0.2},${
        50 - baseSize * 0.5
      } ${140 - baseSize * 0.1},${45 - baseSize * 0.6} Q${
        150 + baseSize * 0.1
      },${55 - baseSize * 0.4} 145,85`,
      straight: `M160,85 L${135 - baseSize * 0.1},${45 - baseSize * 0.8} L${
        145 + baseSize * 0.1
      },${45 - baseSize * 0.8} L150,85`,
      twisted: `M165,85 Q${130 - baseSize * 0.2},${75 - baseSize * 0.2} ${
        140 - baseSize * 0.1
      },${60 - baseSize * 0.4} Q${150 + baseSize * 0.2},${
        50 - baseSize * 0.5
      } ${135 - baseSize * 0.2},${40 - baseSize * 0.7} Q${
        145 + baseSize * 0.1
      },${50 - baseSize * 0.5} ${140 - baseSize * 0.1},${
        65 - baseSize * 0.3
      } Q${135 - baseSize * 0.1},${75 - baseSize * 0.2} 145,85`,
    };

    return (
      <>
        <g className="animate-glow-pulse">
          <path
            d={hornPaths[config.hornStyle]}
            fill={catFeatures.accent}
            stroke="#000"
            strokeWidth="1"
          />
        </g>
        <g className="animate-glow-pulse">
          <path
            transform="scale(-1, 1) translate(-400, 0)"
            d={hornPaths[config.hornStyle]}
            fill={catFeatures.accent}
            stroke="#000"
            strokeWidth="1"
          />
        </g>
      </>
    );
  };

  const renderMarkings = () => {
    if (config.markings === "none") return null;

    const markingColor = catFeatures.accent;

    switch (config.markings) {
      case "stripes":
        return (
          <g opacity="0.6">
            <path
              d="M160,160 Q200,155 240,160"
              stroke={markingColor}
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M155,180 Q200,175 245,180"
              stroke={markingColor}
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M160,200 Q200,195 240,200"
              stroke={markingColor}
              strokeWidth="3"
              fill="none"
            />
          </g>
        );
      case "spots":
        return (
          <g opacity="0.7">
            <circle cx="170" cy="150" r="4" fill={markingColor} />
            <circle cx="230" cy="155" r="5" fill={markingColor} />
            <circle cx="190" cy="180" r="3" fill={markingColor} />
            <circle cx="220" cy="185" r="4" fill={markingColor} />
          </g>
        );
      case "flames":
        return (
          <g opacity="0.8">
            <path
              d="M180,140 Q175,130 180,125 Q185,135 180,140"
              fill={catFeatures.eyes}
            />
            <path
              d="M220,145 Q215,135 220,130 Q225,140 220,145"
              fill={catFeatures.eyes}
            />
          </g>
        );
      default:
        return null;
    }
  };

  const renderCatBody = () => {
    const bodyY =
      config.pose === "crouching"
        ? 190
        : config.pose === "standing"
        ? 150
        : 170;
    const frontLegRotation =
      config.pose === "crouching" ? -30 : config.pose === "sitting" ? 35 : 0;

    const tailRotation =
      config.pose === "crouching" ? 30 : config.pose === "sitting" ? -30 : 0;

    const scale = catFeatures.bodyScale;
    const eyeShape = getEyeShape();

    return (
      <g>
        {/* Tail - length based on tailLength */}
        <path
          transform={`scale(1, 0.75) translate(-20, ${
            bodyY - 150
          }), rotate(${tailRotation}, 280, 180)`}
          d={`M280,180 Q${320 + catFeatures.tailScale * 20},160 ${
            330 + catFeatures.tailScale * 30
          },200 Q${
            325 + catFeatures.tailScale * 25
          },240 290,220 Q285,200 280,180`}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
          className="animate-glow-pulse"
        />

        {/* Back Paws */}
        <ellipse
          cx="160"
          cy={bodyY + 40}
          rx={15 * scale}
          ry={25 * scale}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
        />
        <ellipse
          cx="240"
          cy={bodyY + 40}
          rx={15 * scale}
          ry={25 * scale}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
        />

        {/* Body */}
        <ellipse
          cx="200"
          cy={bodyY}
          rx={80 * scale}
          ry={60 * scale}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
        />

        {renderMarkings()}

        {/* Collar */}
        {includes(config.accessories, "collar") && (
          <g key="collar" transform="translate(0, 12)">
            <path
              d="M165,155 Q200,170 235,155"
              fill="none"
              stroke={catFeatures.accent}
              strokeWidth="16"
              strokeLinecap="round"
            />
            <circle
              cx="200"
              cy="162"
              r="5"
              fill={catFeatures.eyes}
              className="animate-flicker"
            />
          </g>
        )}

        {/* Head */}
        <circle
          cx="200"
          cy="120"
          r={50 * scale}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
        />

        {/** Crown */}
        {config.accessories.includes("crown") && (
          <g key="crown">
            <path
              d="M170,80 L180,60 L190,75 L200,55 L210,75 L220,60 L230,80 L200,85 Z"
              fill={catFeatures.eyes}
              stroke="#000"
              strokeWidth="2"
              className="animate-glow-pulse"
            />
            <circle cx="200" cy="70" r="3" fill={catFeatures.accent} />
          </g>
        )}

        {/* Ears */}
        <path
          d={`M${160 * scale + (200 - 200 * scale)},${
            90 * scale + (120 - 120 * scale)
          } L${170 * scale + (200 - 200 * scale)},${
            60 * scale + (120 - 120 * scale)
          } L${185 * scale + (200 - 200 * scale)},${
            85 * scale + (120 - 120 * scale)
          } Z`}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
        />
        <path
          d={`M${215 * scale + (200 - 200 * scale)},${
            85 * scale + (120 - 120 * scale)
          } L${230 * scale + (200 - 200 * scale)},${
            60 * scale + (120 - 120 * scale)
          } L${240 * scale + (200 - 200 * scale)},${
            90 * scale + (120 - 120 * scale)
          } Z`}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
        />

        {/* Ear insides */}
        <path
          d={`M${167 * scale + (200 - 200 * scale)},${
            82 * scale + (120 - 120 * scale)
          } L${172 * scale + (200 - 200 * scale)},${
            68 * scale + (120 - 120 * scale)
          } L${180 * scale + (200 - 200 * scale)},${
            80 * scale + (120 - 120 * scale)
          } Z`}
          fill={catFeatures.accent}
        />
        <path
          d={`M${220 * scale + (200 - 200 * scale)},${
            80 * scale + (120 - 120 * scale)
          } L${228 * scale + (200 - 200 * scale)},${
            68 * scale + (120 - 120 * scale)
          } L${233 * scale + (200 - 200 * scale)},${
            82 * scale + (120 - 120 * scale)
          } Z`}
          fill={catFeatures.accent}
        />

        {/* Eyes */}
        <ellipse
          cx="185"
          cy="110"
          rx={eyeShape.rx}
          ry={eyeShape.ry}
          fill={catFeatures.eyes}
          stroke="#000"
          className={
            catFeatures.eyeGlowIntensity > 0.5 ? "animate-flicker" : ""
          }
          filter={catFeatures.eyeGlowIntensity > 0.3 ? "url(#glow)" : "none"}
        />
        <ellipse
          cx="215"
          cy="110"
          rx={eyeShape.rx}
          ry={eyeShape.ry}
          fill={catFeatures.eyes}
          stroke="#000"
          className={
            catFeatures.eyeGlowIntensity > 0.5 ? "animate-flicker" : ""
          }
          filter={catFeatures.eyeGlowIntensity > 0.3 ? "url(#glow)" : "none"}
        />

        {/* Eye pupils */}
        <ellipse
          cx="185"
          cy="112"
          rx={eyeShape.pupils.rx}
          ry={eyeShape.pupils.ry}
          fill="#000"
        />
        <ellipse
          cx="215"
          cy="112"
          rx={eyeShape.pupils.rx}
          ry={eyeShape.pupils.ry}
          fill="#000"
        />

        {/* Nose */}
        <path
          d="M200,125 L195,135 L205,135 Z"
          fill={catFeatures.accent}
          stroke="#000"
        />

        {/* Mouth */}
        <path d={getMouthCurve()} stroke="#000" strokeWidth="2" fill="none" />

        {/* Fangs - more prominent based on wickedness */}
        <path
          d={`M190,140 L${188 - catFeatures.wickednessLevel * 2},${
            150 + catFeatures.wickednessLevel * 5
          } L192,145 Z`}
          fill="#fff"
          stroke="#666"
        />
        <path
          d={`M210,140 L208,145 L${212 + catFeatures.wickednessLevel * 2},${
            150 + catFeatures.wickednessLevel * 5
          } Z`}
          fill="#fff"
          stroke="#666"
        />

        {/* Front Paws */}
        <ellipse
          cx="170"
          cy={bodyY + 45}
          rx={15 * scale}
          ry={25 * scale}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
          transform={`rotate(${-1 * frontLegRotation},170,${bodyY + 45})`}
        />
        <ellipse
          cx="230"
          cy={bodyY + 45}
          rx={15 * scale}
          ry={25 * scale}
          fill={catFeatures.body}
          stroke="#000"
          strokeWidth="2"
          transform={`rotate(${frontLegRotation},230,${bodyY + 45})`}
        />
      </g>
    );
  };

  return (
    <div className="flex w-full justify-center">
      <svg
        id="hell-cat-svg"
        viewBox="0 0 400 320"
        className="w-full max-w-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur
              stdDeviation={3 * catFeatures.eyeGlowIntensity}
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {renderCatBody()}
        {renderHorns()}
      </svg>
    </div>
  );
};
