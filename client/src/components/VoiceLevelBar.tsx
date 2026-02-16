import { useMemo } from "react";
import type { Member } from "@/types/member";
import { VOICE_LEVEL_LABELS } from "@/types/member";
import { cn } from "@/lib/utils";

/**
 * Design: VU Meter Style Voice Level Bar
 * - Horizontal bar with blue-to-red gradient
 * - LED-style markers for each member
 * - Selected member highlighted with pulse animation
 * - Mobile responsive
 */

interface VoiceLevelBarProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  isMobile?: boolean;
}

// VUメーター風の色を取得
function getVoiceLevelColor(level: number): string {
  if (level <= 2) return "bg-blue-500";
  if (level <= 4) return "bg-cyan-400";
  if (level <= 6) return "bg-green-500";
  if (level <= 8) return "bg-yellow-500";
  return "bg-red-500";
}

function getVoiceLevelGlow(level: number): string {
  if (level <= 2) return "shadow-[0_0_8px_rgba(59,130,246,0.8)]";
  if (level <= 4) return "shadow-[0_0_8px_rgba(34,211,238,0.8)]";
  if (level <= 6) return "shadow-[0_0_8px_rgba(34,197,94,0.8)]";
  if (level <= 8) return "shadow-[0_0_8px_rgba(234,179,8,0.8)]";
  return "shadow-[0_0_8px_rgba(239,68,68,0.8)]";
}

export function VoiceLevelBar({ 
  members, 
  selectedMemberId, 
  onSelectMember,
  isMobile = false,
}: VoiceLevelBarProps) {
  // 声の大きさでグループ化
  const groupedMembers = useMemo(() => {
    const groups: Record<number, Member[]> = {};
    for (let i = 1; i <= 10; i++) {
      groups[i] = [];
    }
    members.forEach((member) => {
      groups[member.voiceLevel].push(member);
    });
    return groups;
  }, [members]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className={cn("mixer-panel space-y-3", isMobile ? "p-3" : "p-4 space-y-4")}>
      {/* ヘッダー */}
      <div className={cn(
        "flex items-center",
        isMobile ? "flex-col gap-2" : "justify-between"
      )}>
        <h2 className={cn(
          "font-semibold text-muted-foreground uppercase tracking-wider font-mono",
          isMobile ? "text-xs" : "text-sm"
        )}>
          Voice Level Distribution
        </h2>
        {selectedMember && (
          <div className={cn(
            "flex items-center gap-2",
            isMobile && "bg-accent/30 px-3 py-1.5 rounded-full"
          )}>
            <div className={cn("led-indicator", getVoiceLevelColor(selectedMember.voiceLevel), "animate-pulse")} />
            <span className={cn("font-medium", isMobile ? "text-sm" : "text-sm")}>
              {selectedMember.name}
            </span>
            <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>
              Lv.{selectedMember.voiceLevel} - {VOICE_LEVEL_LABELS[selectedMember.voiceLevel]?.label}
            </span>
          </div>
        )}
      </div>

      {/* VUメーター風グラデーションバー */}
      <div className="relative">
        {/* 背景グラデーション */}
        <div className={cn("rounded-full vu-gradient opacity-30", isMobile ? "h-2" : "h-3")} />
        
        {/* 目盛り */}
        <div className={cn("absolute inset-x-0 top-0 flex", isMobile ? "h-2" : "h-3")}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="flex-1 border-r border-background/50 last:border-r-0" />
          ))}
        </div>
      </div>

      {/* レベル番号とラベル */}
      <div className={cn("flex font-mono", isMobile ? "text-[10px]" : "text-xs")}>
        {Array.from({ length: 10 }, (_, i) => {
          const level = i + 1;
          const isSelected = selectedMember?.voiceLevel === level;
          return (
            <div
              key={level}
              className={cn(
                "flex-1 text-center transition-colors",
                isSelected ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              {level}
            </div>
          );
        })}
      </div>

      {/* 成員マーカー */}
      <div className={cn("flex gap-0.5", isMobile ? "h-28" : "h-24")}>
        {Array.from({ length: 10 }, (_, i) => {
          const level = i + 1;
          const membersAtLevel = groupedMembers[level];
          const isSelectedLevel = selectedMember?.voiceLevel === level;

          return (
            <div
              key={level}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 rounded transition-all overflow-y-auto",
                isMobile ? "p-0.5" : "p-1",
                isSelectedLevel && "bg-accent/50"
              )}
            >
              {membersAtLevel.map((member) => {
                const isSelected = member.id === selectedMemberId;
                return (
                  <button
                    key={member.id}
                    onClick={() => onSelectMember(member.id)}
                    className={cn(
                      "w-full rounded font-medium truncate transition-all",
                      isMobile ? "min-h-[28px] px-0.5 py-1 text-[9px]" : "min-h-[24px] px-1 py-0.5 text-[10px]",
                      getVoiceLevelColor(level),
                      isSelected && [
                        getVoiceLevelGlow(level),
                        "ring-2 ring-primary animate-pulse"
                      ],
                      !isSelected && "opacity-70 hover:opacity-100 active:opacity-100"
                    )}
                    title={`${member.name} - Lv.${member.voiceLevel}`}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* レベル説明 */}
      <div className={cn("flex text-muted-foreground", isMobile ? "text-[9px]" : "text-[10px]")}>
        <div className="flex-1 text-left">← 小さい</div>
        <div className="flex-1 text-center">普通</div>
        <div className="flex-1 text-right">大きい →</div>
      </div>
    </div>
  );
}
