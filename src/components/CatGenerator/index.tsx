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
import { colorSchemeDetails, type accessories, type CatConfig } from "./types";

interface CatGeneratorProps {
  config: CatConfig;
  onChange: (config: CatConfig) => void;
}

export const CatGenerator = ({ config, onChange }: CatGeneratorProps) => {
  const updateConfig = <K extends keyof CatConfig>(
    key: K,
    value: CatConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  };

  const updateSliderValue = <K extends keyof CatConfig>(
    key: K,
    values: number[]
  ) => {
    updateConfig(key, values[0] as CatConfig[K]);
  };

  const toggleAccessory = (accessory: (typeof accessories)[number]) => {
    const newAccessories = includes(config.accessories, accessory)
      ? filter(config.accessories, (a) => a !== accessory)
      : [...config.accessories, accessory];
    updateConfig("accessories", newAccessories);
  };

  return (
    <div className="max-h-[600px] space-y-6 overflow-y-auto pr-2">
      {/* Basic Attributes */}
      <div className="space-y-4">
        <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
          👹 Basic Attributes
        </h3>

        {/* Horn Style */}
        <div className="space-y-2">
          <Label className="text-hell-fire">Horn Style</Label>
          <Select
            value={config.hornStyle}
            onValueChange={(value: any) => updateConfig("hornStyle", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="curved">🎯 Curved Horns</SelectItem>
              <SelectItem value="straight">⚔️ Straight Horns</SelectItem>
              <SelectItem value="twisted">🌪️ Twisted Horns</SelectItem>
              <SelectItem value="none">😇 No Horns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Horn Size Slider */}
        {config.hornStyle !== "none" && (
          <div className="space-y-2">
            <Label className="text-hell-ember">
              Horn Size: <Badge variant="secondary">{config.hornSize}%</Badge>
            </Label>
            <Slider
              value={[config.hornSize]}
              onValueChange={(values) => updateSliderValue("hornSize", values)}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Expression */}
        <div className="space-y-2">
          <Label className="text-hell-blood">Expression</Label>
          <Select
            value={config.expression}
            onValueChange={(value: any) => updateConfig("expression", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">😐 Neutral</SelectItem>
              <SelectItem value="menacing">😈 Menacing</SelectItem>
              <SelectItem value="playful">😸 Playful</SelectItem>
              <SelectItem value="sleepy">😴 Sleepy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-hell-ember/30" />

      {/* Eyes & Glow */}
      <div className="space-y-4">
        <h3 className="text-hell-glow flex items-center gap-2 text-lg font-semibold">
          👁️ Eyes & Glow
        </h3>

        {/* Eye Color */}
        <div className="space-y-2">
          <Label className="text-hell-ember">Eye Color</Label>
          <Select
            value={config.eyeColor}
            onValueChange={(value: any) => updateConfig("eyeColor", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fire">🔥 Fire Orange</SelectItem>
              <SelectItem value="ember">✨ Ember Red</SelectItem>
              <SelectItem value="glow">💛 Golden Glow</SelectItem>
              <SelectItem value="blood">🩸 Blood Red</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Eye Glow Intensity */}
        <div className="space-y-2">
          <Label className="text-hell-glow">
            Eye Glow Intensity:{" "}
            <Badge variant="secondary">{config.eyeGlow}%</Badge>
          </Label>
          <Slider
            value={[config.eyeGlow]}
            onValueChange={(values) => updateSliderValue("eyeGlow", values)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      <Separator className="bg-hell-ember/30" />

      {/* Body & Pose */}
      <div className="space-y-4">
        <h3 className="text-hell-ember flex items-center gap-2 text-lg font-semibold">
          🐱 Body & Pose
        </h3>

        {/* Pose */}
        <div className="space-y-2">
          <Label className="text-hell-blood">Pose</Label>
          <Select
            value={config.pose}
            onValueChange={(value: any) => updateConfig("pose", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sitting">🪑 Sitting</SelectItem>
              <SelectItem value="standing">🚶 Standing</SelectItem>
              <SelectItem value="crouching">🐾 Crouching</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Body Size */}
        <div className="space-y-2">
          <Label className="text-hell-ember">
            Body Size: <Badge variant="secondary">{config.bodySize}%</Badge>
          </Label>
          <Slider
            value={[config.bodySize]}
            onValueChange={(values) => updateSliderValue("bodySize", values)}
            min={25}
            max={75}
            step={5}
            className="w-full"
          />
        </div>

        {/* Tail Length */}
        <div className="space-y-2">
          <Label className="text-hell-fire">
            Tail Length: <Badge variant="secondary">{config.tailLength}%</Badge>
          </Label>
          <Slider
            value={[config.tailLength]}
            onValueChange={(values) => updateSliderValue("tailLength", values)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      <Separator className="bg-hell-ember/30" />

      {/* Appearance */}
      <div className="space-y-4">
        <h3 className="text-hell-ember flex items-center gap-2 text-lg font-semibold">
          🎨 Appearance
        </h3>

        {/* Color Scheme */}
        <div className="space-y-2">
          <Label className="text-hell-fire">Color Scheme</Label>
          <Select
            value={config.colorScheme}
            onValueChange={(value: any) => updateConfig("colorScheme", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {map(colorSchemeDetails, (details, key) => (
                <SelectItem key={key} value={key}>
                  {details.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Body Markings */}
        <div className="space-y-2">
          <Label className="text-hell-glow">Body Markings</Label>
          <Select
            value={config.markings}
            onValueChange={(value: any) => updateConfig("markings", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">⚪ None</SelectItem>
              <SelectItem value="stripes">🦓 Hell Stripes</SelectItem>
              <SelectItem value="spots">🐆 Demon Spots</SelectItem>
              <SelectItem value="flames">🔥 Flame Patterns</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-hell-ember/30" />

      {/* Accessories */}
      <div className="space-y-3">
        <h3 className="text-hell-fire flex items-center gap-2 text-lg font-semibold">
          👑 Accessories
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="collar"
              checked={config.accessories.includes("collar")}
              onCheckedChange={() => toggleAccessory("collar")}
            />
            <Label htmlFor="collar" className="text-sm">
              🎵 Hellscore Collar
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="crown"
              checked={config.accessories.includes("crown")}
              onCheckedChange={() => toggleAccessory("crown")}
            />
            <Label htmlFor="crown" className="text-sm">
              👑 Hell Crown
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
