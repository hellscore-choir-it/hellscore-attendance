import { filter, includes, map } from "lodash";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Slider } from "../ui/slider";
import {
  colorSchemeDetails,
  rareColorSchemes,
  type accessories,
  type CatConfig,
} from "./types";

interface CatGeneratorProps {
  config: CatConfig;
  onChange: (config: CatConfig) => void;
  disabled?: boolean;
  rareTraitsEnabled?: boolean;
}

export const CatGenerator = ({
  config,
  onChange,
  disabled = false,
  rareTraitsEnabled = true,
}: CatGeneratorProps) => {
  const updateConfig = <K extends keyof CatConfig>(
    key: K,
    value: CatConfig[K]
  ) => {
    if (disabled) return;
    onChange({ ...config, [key]: value });
  };

  const updateSliderValue = <K extends keyof CatConfig>(
    key: K,
    values: number[]
  ) => {
    updateConfig(key, values[0] as CatConfig[K]);
  };

  const toggleAccessory = (accessory: (typeof accessories)[number]) => {
    if (disabled) return;
    const newAccessories = includes(config.accessories, accessory)
      ? filter(config.accessories, (a) => a !== accessory)
      : [...config.accessories, accessory];
    updateConfig("accessories", newAccessories);
  };

  return (
    <div className="max-h-[600px] overflow-y-auto pr-2">
      <div
        style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}
      >
        {/* Basic Attributes */}
        <div className="space-y-4">
          <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
            👹 מאפיינים בסיסיים
          </h3>

          {/* Horn Style */}
          <div className="space-y-2">
            <Label>סגנון קרניים</Label>
            <Select
              value={config.hornStyle}
              onValueChange={(value: any) => updateConfig("hornStyle", value)}
              disabled={disabled}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curved">🎯 קרניים מעוגלות</SelectItem>
                <SelectItem value="straight">⚔️ קרניים ישרות</SelectItem>
                <SelectItem value="twisted">🌪️ קרניים מסולסלות</SelectItem>
                <SelectItem value="none">😇 בלי קרניים</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Horn Size Slider */}
          {config.hornStyle !== "none" && (
            <div className="space-y-2">
              <Label>
                גודל קרניים: <Badge variant="secondary">{config.hornSize}%</Badge>
              </Label>
              <Slider
                value={[config.hornSize]}
                onValueChange={(values) =>
                  updateSliderValue("hornSize", values)
                }
                max={100}
                step={5}
                className="w-full"
                disabled={disabled}
              />
            </div>
          )}

          {/* Expression */}
          <div className="space-y-2">
            <Label>הבעה</Label>
            <Select
              value={config.expression}
              onValueChange={(value: any) => updateConfig("expression", value)}
              disabled={disabled}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">😐 ניטרלי</SelectItem>
                <SelectItem value="menacing">😈 מאיים</SelectItem>
                <SelectItem value="playful">😸 שובב</SelectItem>
                <SelectItem value="sleepy">😴 מנומנם</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="bg-hell-ember/30" />

        {/* Eyes & Glow */}
        <div className="space-y-4">
          <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
            👁️ עיניים וזוהר
          </h3>

          {/* Eye Color */}
          <div className="space-y-2">
            <Label>צבע עיניים</Label>
            <Select
              value={config.eyeColor}
              onValueChange={(value: any) => updateConfig("eyeColor", value)}
              disabled={disabled}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fire">🔥 כתום אש</SelectItem>
                <SelectItem value="ember">✨ אדום גחלים</SelectItem>
                <SelectItem value="glow">💛 זוהר זהוב</SelectItem>
                <SelectItem value="blood">🩸 אדום דם</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Eye Glow Intensity */}
          <div className="space-y-2">
            <Label>
              עוצמת זוהר עיניים:{" "}
              <Badge variant="secondary">{config.eyeGlow}%</Badge>
            </Label>
            <Slider
              value={[config.eyeGlow]}
              onValueChange={(values) => updateSliderValue("eyeGlow", values)}
              max={100}
              step={5}
              className="w-full"
              disabled={disabled}
            />
          </div>
        </div>

        <Separator className="bg-hell-ember/30" />

        {/* Body & Pose */}
        <div className="space-y-4">
          <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
            🐱 גוף ותנוחה
          </h3>

          {/* Pose */}
          <div className="space-y-2">
            <Label>תנוחה</Label>
            <Select
              value={config.pose}
              onValueChange={(value: any) => updateConfig("pose", value)}
              disabled={disabled}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sitting">🪑 יושב</SelectItem>
                <SelectItem value="standing">🚶 עומד</SelectItem>
                <SelectItem value="crouching">🐾 מתכופף</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Body Size */}
          <div className="space-y-2">
            <Label>
              גודל גוף: <Badge variant="secondary">{config.bodySize}%</Badge>
            </Label>
            <Slider
              value={[config.bodySize]}
              onValueChange={(values) => updateSliderValue("bodySize", values)}
              min={25}
              max={75}
              step={5}
              className="w-full"
              disabled={disabled}
            />
          </div>

          {/* Tail Length */}
          <div className="space-y-2">
            <Label>
              אורך זנב:{" "}
              <Badge variant="secondary">{config.tailLength}%</Badge>
            </Label>
            <Slider
              value={[config.tailLength]}
              onValueChange={(values) =>
                updateSliderValue("tailLength", values)
              }
              max={100}
              step={5}
              className="w-full"
              disabled={disabled}
            />
          </div>
        </div>

        <Separator className="bg-hell-ember/30" />

        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
            🎨 מראה
          </h3>

          {/* Color Scheme */}
          <div className="space-y-2">
            <Label>ערכת צבעים</Label>
            <Select
              value={config.colorScheme}
              onValueChange={(value: any) => updateConfig("colorScheme", value)}
              disabled={disabled}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {map(colorSchemeDetails, (details, key) => {
                  const isRare = includes(
                    rareColorSchemes as readonly string[],
                    key
                  );
                  if (isRare && !rareTraitsEnabled) return null;

                  return (
                    <SelectItem key={key} value={key}>
                      {details.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Body Markings */}
          <div className="space-y-2">
            <Label>סימני גוף</Label>
            <Select
              value={config.markings}
              onValueChange={(value: any) => updateConfig("markings", value)}
              disabled={disabled}
            >
              <SelectTrigger disabled={disabled}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">⚪ ללא</SelectItem>
                <SelectItem value="stripes">🦓 פסים מהשאול</SelectItem>
                <SelectItem value="spots">🐆 נקודות שדים</SelectItem>
                <SelectItem value="flames">🔥 דפוסי להבה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="bg-hell-ember/30" />

        {/* Accessories */}
        <div className="space-y-3">
          <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
            👑 אביזרים
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="collar"
                checked={includes(config.accessories, "collar")}
                onCheckedChange={() => toggleAccessory("collar")}
                disabled={disabled}
              />
              <Label htmlFor="collar" className="text-sm">
                🎵 קולר Hellscore
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="crown"
                checked={includes(config.accessories, "crown")}
                onCheckedChange={() => toggleAccessory("crown")}
                disabled={disabled}
              />
              <Label htmlFor="crown" className="text-sm">
                👑 כתר מהשאול
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
