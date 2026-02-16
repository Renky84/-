
import { useState, useEffect } from "react";
import type { Member, EqualizerSettings } from "@/types/member";
import { DEFAULT_EQ_SETTINGS, VOICE_LEVEL_LABELS } from "@/types/member";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Mic, MicOff, RotateCcw, Save } from "lucide-react";
import EQKnob from "@/components/EQKnob";

/**
 * Design: Mixer Console Equalizer Panel
 * - Fader-style vertical sliders
 * - VU meter inspired layout
 * - LED indicators for levels
 * - Mobile responsive
 */

interface EqualizerPanelProps {
  member: Member | null;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
  onUpdateEq: (id: string, eq: Partial<EqualizerSettings>) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

// フェーダースライダーコンポーネント
function FaderSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
  compact,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  // 値に応じた色を計算
  const getValueColor = () => {
    const normalized = (value - min) / (max - min);
    if (normalized < 0.3) return "bg-blue-500";
    if (normalized < 0.5) return "bg-green-500";
    if (normalized < 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", disabled && "opacity-50")}>
      <span className={cn(
        "font-mono text-muted-foreground uppercase tracking-wider",
        compact ? "text-[9px]" : "text-[10px]"
      )}>
        {label}
      </span>
      <div className={cn(
        "relative w-10 flex flex-col items-center",
        compact ? "h-24" : "h-32"
      )}>
        {/* 目盛り */}
        <div className="absolute inset-y-0 left-0 w-1 flex flex-col justify-between py-1">
          <div className="w-1 h-px bg-muted-foreground/30" />
          <div className="w-1 h-px bg-muted-foreground/30" />
          <div className="w-1.5 h-px bg-muted-foreground/50" />
          <div className="w-1 h-px bg-muted-foreground/30" />
          <div className="w-1 h-px bg-muted-foreground/30" />
        </div>
        {/* スライダー */}
        <Slider
          orientation="vertical"
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={([v]) => onChange(v)}
          disabled={disabled}
          className="h-full"
        />
      </div>
      {/* 値表示 */}
      <div className="flex flex-col items-center">
        <div className={cn("rounded-full mb-1", getValueColor(), compact ? "w-1.5 h-1.5" : "w-2 h-2")} />
        <span className={cn("font-mono", compact ? "text-[10px]" : "text-xs")}>
          {value > 0 ? "+" : ""}{value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>
    </div>
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const to01 = (value: number, min: number, max: number) => clamp01((value - min) / (max - min));
const from01 = (t: number, min: number, max: number) => min + clamp01(t) * (max - min);

export function EqualizerPanel({ 
  member, 
  onUpdateMember, 
  onUpdateEq,
  isMobile = false,
  onClose,
}: EqualizerPanelProps) {
  const [localEq, setLocalEq] = useState<EqualizerSettings>(DEFAULT_EQ_SETTINGS);
  const [localVoiceLevel, setLocalVoiceLevel] = useState(5);
  const [hasChanges, setHasChanges] = useState(false);

  // 選択された成員が変わったらローカル状態を更新
  useEffect(() => {
    if (member) {
      setLocalEq(member.eqSettings ?? DEFAULT_EQ_SETTINGS);
      setLocalVoiceLevel(member.voiceLevel);
      setHasChanges(false);
    }
  }, [member?.id]);

  if (!member) {
    return (
      <div className="mixer-panel h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className={cn(
            "mx-auto mb-4 rounded-full bg-muted flex items-center justify-center",
            isMobile ? "w-12 h-12" : "w-16 h-16"
          )}>
            <MicOff className={cn(isMobile ? "w-6 h-6" : "w-8 h-8")} />
          </div>
          <p className={cn(isMobile ? "text-base" : "text-sm")}>成員を選択してください</p>
        </div>
      </div>
    );
  }

  const handleEqChange = (key: keyof EqualizerSettings, value: number | string) => {
    setLocalEq((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleVoiceLevelChange = (value: number) => {
    setLocalVoiceLevel(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateMember(member.id, { voiceLevel: localVoiceLevel });
    if (member.isSpeaker) {
      onUpdateEq(member.id, localEq);
    }
    setHasChanges(false);
    toast.success("設定を保存しました");
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    setLocalEq(DEFAULT_EQ_SETTINGS);
    setLocalVoiceLevel(5);
    setHasChanges(true);
  };

  const handleToggleSpeaker = (checked: boolean) => {
    onUpdateMember(member.id, {
      isSpeaker: checked,
      eqSettings: checked ? localEq : undefined,
    });
    toast.success(checked ? "演題者として設定しました" : "演題者設定を解除しました");
  };

  return (
    <div className={cn("mixer-panel flex flex-col", isMobile ? "h-auto" : "h-full")}>
     

      {/* ヘッダー - モバイルモーダルでは非表示 */}
      {!isMobile && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Settings
            </h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleReset}
                title="リセット"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                保存
              </Button>
            </div>
          </div>
          {/* 成員名 */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              member.isSpeaker ? "bg-primary animate-pulse" : "bg-muted"
            )} />
            <span className="font-medium truncate">{member.name}</span>
          </div>
        </div>
      )}

      {/* コンテンツ */}
      <div className={cn(
        "flex-1 overflow-y-auto space-y-4",
        isMobile ? "p-4" : "p-3"
      )}>
        {/* 演題者トグル */}
        <div className={cn(
          "flex items-center justify-between rounded bg-accent/30",
          isMobile ? "p-3" : "p-2"
        )}>
          <div className="flex items-center gap-2">
            <Mic className={cn("text-primary", isMobile ? "h-5 w-5" : "h-4 w-4")} />
            <span className={cn(isMobile ? "text-base" : "text-sm")}>演題に立つ人</span>
          </div>
          <Switch
            checked={member.isSpeaker}
            onCheckedChange={handleToggleSpeaker}
          />
        </div>

        {/* 声の大きさ */}
        <div className="space-y-2">
          <label className={cn(
            "font-mono text-muted-foreground uppercase tracking-wider",
            isMobile ? "text-xs" : "text-xs"
          )}>
            Voice Level
          </label>
          <div className={cn("rounded bg-accent/20", isMobile ? "p-4" : "p-3")}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("font-bold font-mono", isMobile ? "text-3xl" : "text-2xl")}>
                {localVoiceLevel}
              </span>
              <span className={cn("text-muted-foreground", isMobile ? "text-base" : "text-sm")}>
                {VOICE_LEVEL_LABELS[localVoiceLevel]?.label}
              </span>
            </div>
          <Slider
  value={[localVoiceLevel]}
  min={1}
  max={10}
  step={1}
  onValueChange={([v]) => handleVoiceLevelChange(v)}
  className="w-full my-4"
/>
            <div className={cn(
              "flex justify-between text-muted-foreground mt-1",
              isMobile ? "text-xs" : "text-[10px]"
            )}>
              <span>小さい</span>
              <span>普通</span>
              <span>大きい</span>
            </div>
            <p className={cn("text-muted-foreground mt-2", isMobile ? "text-sm" : "text-xs")}>
              {VOICE_LEVEL_LABELS[localVoiceLevel]?.description}
            </p>
          </div>
        </div>

        {/* イコライザー設定（演題者のみ） */}
        {member.isSpeaker && (
          <div className="space-y-3">
            <label className={cn(
              "font-mono text-muted-foreground uppercase tracking-wider",
              isMobile ? "text-xs" : "text-xs"
            )}>
              Equalizer (Yamaha Style)
            </label>
            
           {/* EQ ノブ（HIGH / MID W / MID / LOW ） */}
<div className={cn("rounded bg-accent/20", isMobile ? "p-4" : "p-3")}>
 <div className="grid grid-cols-3.9 gap-3 items-start">
   {/* HIGH (-15〜+15) */}
<div className="relative flex flex-col items-center justify-between h-[150px]">
  {/* 左上に重ねるラベル */}
  <span
    className={cn(
      "absolute -top-2 left-0 font-mono text-muted-foreground uppercase tracking-wider",
      isMobile ? "text-[9px]" : "text-[10px]"
    )}
  >
    HIGH
  </span>

 <EQKnob
  size={isMobile ? 67 : 67}
  value={localEq.high}
  min={-15}
  max={15}
  onChange={(v) => handleEqChange("high", Number(v.toFixed(1)))}
/>

  {/* -15 / +15（画像っぽくしたいなら追加） */}
  <div className="w-full flex justify-between text-[10px] font-mono text-muted-foreground -mt-1 px-1">
    <span>-15</span>
    <span>+15</span>
  </div>

  <span className={cn("font-mono", isMobile ? "text-[10px]" : "text-xs")}>
    {localEq.low > 0 ? "+" : ""}
    {localEq.low.toFixed(1)}
  </span>
</div>

    <div className="relative flex flex-col items-center gap-2">
  <span className={cn(
    "absolute -top-0 left-0 font-mono text-muted-foreground uppercase tracking-wider",
    isMobile ? "text-[9px]" : "text-[10px]"
  )}>
    MID W
  </span>

 <EQKnob
  size={isMobile ? 67 : 67}
  value={localEq.midWidth}
  min={-15}
  max={15}
  onChange={(v) => handleEqChange("midWidth", Number(v.toFixed(1)))}
/>
  <span className={cn("font-mono", isMobile ? "text-[10px]" : "text-xs")}>
    {localEq.midWidth.toFixed(1)}
  </span>
</div>

    {/* MID (-15〜+15) */}
    <div className="relative flex flex-col items-center gap-2">
      <span className={cn("font-mono text-muted-foreground uppercase tracking-wider", isMobile ? "text-[9px]" : "text-[10px]")}>
        MID
      </span>
      <EQKnob
  size={isMobile ? 67 : 67}
  value={localEq.mid}
  min={-15}
  max={15}
  onChange={(v) => handleEqChange("mid", Number(v.toFixed(1)))}
/>
      <span className={cn("font-mono", isMobile ? "text-[10px]" : "text-xs")}>
        {localEq.mid > 0 ? "+" : ""}{localEq.mid.toFixed(1)}
      </span>
    </div>

    {/* LOW (-15〜+15) */}
    <div className="relative flex flex-col items-center gap-2">
      <span className={cn("font-mono text-muted-foreground uppercase tracking-wider", isMobile ? "text-[9px]" : "text-[10px]")}>
        LOW
      </span>
      <EQKnob
  size={isMobile ? 67 : 67}
  value={localEq.low}
  min={-15}
  max={15}
  onChange={(v) => handleEqChange("low", Number(v.toFixed(1)))}
/>
      
      <span className={cn("font-mono", isMobile ? "text-[10px]" : "text-xs")}>
        {localEq.low > 0 ? "+" : ""}{localEq.low.toFixed(1)}
      </span>
    </div>
  </div>
</div>

            {/* 全体音量 */}
            <div className={cn("rounded bg-accent/20", isMobile ? "p-4" : "p-3")}>
              <div className="relative flex items-center justify-between mb-2">
                <span className={cn(
                  "font-mono text-muted-foreground uppercase",
                  isMobile ? "text-sm" : "text-xs"
                )}>Volume</span>
                <span className={cn("font-mono", isMobile ? "text-base" : "text-sm")}>
                  {localEq.volume > 0 ? "+" : ""}{localEq.volume.toFixed(1)} dB
                </span>
              </div>
              <Slider
  value={[localEq.volume]}
  min={-60}
  max={10}
  step={0.5}
  onValueChange={([v]) => handleEqChange("volume", v)}
  className="w-full my-4"
/>
              <div className={cn(
                "relative flex justify-between text-muted-foreground mt-1",
                isMobile ? "text-xs" : "text-[10px]"
              )}>
                <span>-60</span>
                <span>0</span>
                <span>+10</span>
              </div>
            </div>

            {/* メモ */}
            <div className="space-y-2">
              <label className={cn(
                "font-mono text-muted-foreground uppercase tracking-wider",
                isMobile ? "text-xs" : "text-xs"
              )}>
                Notes
              </label>
              <Textarea
                value={localEq.notes}
                onChange={(e) => handleEqChange("notes", e.target.value)}
                placeholder="イコライザー設定のメモ..."
                className={cn("bg-input", isMobile ? "min-h-[100px] text-base" : "min-h-[80px] text-sm")}
              />
            </div>
          </div>
        )}

        {/* 声の大きさの基準説明 - モバイルでは折りたたみ可能 */}
        {!isMobile && (
          <div className="space-y-2">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Voice Level Guide
            </label>
            <div className="p-2 rounded bg-accent/10 text-xs space-y-1">
              {Object.entries(VOICE_LEVEL_LABELS).map(([level, { label, description }]) => (
                <div
                  key={level}
                  className={cn(
                    "flex gap-2 py-0.5",
                    parseInt(level) === localVoiceLevel && "text-primary font-medium"
                  )}
                >
                  <span className="font-mono w-4">{level}</span>
                  <span className="w-24">{label}</span>
                  <span className="text-muted-foreground">{description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* モバイル用保存ボタン */}
        {isMobile && (
          <div className="pt-2 pb-4 space-y-2">
            <Button
              variant="default"
              className="w-full h-12 text-base"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="h-5 w-5 mr-2" />
              設定を保存
            </Button>
            <Button
              variant="outline"
              className="w-full h-10"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              リセット
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
