import { useState } from "react";
import { useMembers } from "@/hooks/useMembers";
import { VoiceLevelBar } from "@/components/VoiceLevelBar";
import { MemberList } from "@/components/MemberList";
import { EqualizerPanel } from "@/components/EqualizerPanel";
import { Loader2, Volume2, Users, BarChart3, Sliders, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Design Philosophy: Mixer Console Industrial Design
 * - Dark mode base inspired by professional audio equipment
 * - Responsive: Desktop 3-column / Mobile tab-based navigation
 * - VU meter-style gradients and LED indicators
 * - Fader-style controls for EQ settings
 */

type MobileTab = "members" | "graph" | "settings";

export default function Home() {
  const {
    members,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
    deleteAllMembers, // ✅ 追加
    updateEqSettings,
    importFromCSV,
    exportToCSV,
  } = useMembers();

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("members");
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  // ✅ 全削除
  const handleDeleteAllMembers = () => {
    // members は useMembers の state なので、useMembers 側に全削除関数が必要
    // （次の②で追加する）
    deleteAllMembers();
    setSelectedMemberId(null);
    setShowMobileSettings(false);
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;

  // モバイルで成員を選択したときの処理
  const handleMobileSelectMember = (id: string) => {
    setSelectedMemberId(id);
    // 設定パネルを表示
    setShowMobileSettings(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ヘッダー */}
      <header className="h-12 md:h-12 border-b border-border flex items-center px-3 md:px-4 bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded bg-primary/20 flex items-center justify-center">
            <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-semibold">音響管理アプリ</h1>
            <p className="text-[9px] md:text-[10px] text-muted-foreground font-mono hidden sm:block">
              Sound Manager v1.0
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono">{members.length}</span>
            <span className="hidden sm:inline">members</span>
          </div>
        </div>
      </header>

      {/* デスクトップ用レイアウト */}
      <main className="flex-1 hidden md:flex overflow-hidden">
        {/* 左サイドバー: 成員リスト */}
       <aside className="w-64 border-r border-border flex-shrink-0">
  <MemberList
    members={members}
    selectedMemberId={selectedMemberId}
    onSelectMember={setSelectedMemberId}
    onAddMember={addMember}
    onDeleteMember={deleteMember}
    onImportCSV={importFromCSV}
    onExportCSV={exportToCSV}
    onDeleteAllMembers={handleDeleteAllMembers}
  />
</aside>


        {/* 中央: 声の大きさグラフ */}
        <section className="flex-1 flex flex-col overflow-hidden p-4">
          <VoiceLevelBar
            members={members}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
          />
          
          {/* 統計情報 */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            <StatCard
              label="とても小さい (1-2)"
              count={members.filter((m) => m.voiceLevel <= 2).length}
              color="bg-blue-500"
            />
            <StatCard
              label="小さい〜普通 (3-5)"
              count={members.filter((m) => m.voiceLevel >= 3 && m.voiceLevel <= 5).length}
              color="bg-green-500"
            />
            <StatCard
              label="普通〜大きい (6-8)"
              count={members.filter((m) => m.voiceLevel >= 6 && m.voiceLevel <= 8).length}
              color="bg-yellow-500"
            />
            <StatCard
              label="とても大きい (9-10)"
              count={members.filter((m) => m.voiceLevel >= 9).length}
              color="bg-red-500"
            />
          </div>

          {/* 演題者リスト */}
          <div className="mt-4 mixer-panel p-4 flex-1 overflow-hidden">
            <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">
              Speakers with EQ Settings
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto max-h-[200px]">
              {members.filter((m) => m.isSpeaker).length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                  演題者がいません
                </p>
              ) : (
                members
                  .filter((m) => m.isSpeaker)
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`
                        p-2 rounded text-left transition-all
                        ${member.id === selectedMemberId
                          ? "bg-primary/20 ring-1 ring-primary"
                          : "bg-accent/30 hover:bg-accent/50"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-sm truncate">{member.name}</span>
                      </div>
                      {member.eqSettings && (
                        <div className="mt-1 text-[10px] font-mono text-muted-foreground">
                          L:{member.eqSettings.low > 0 ? "+" : ""}{member.eqSettings.low} 
                          M:{member.eqSettings.mid > 0 ? "+" : ""}{member.eqSettings.mid} 
                          H:{member.eqSettings.high > 0 ? "+" : ""}{member.eqSettings.high}
                        </div>
                      )}
                    </button>
                  ))
              )}
            </div>
          </div>
        </section>

        {/* 右サイドバー: イコライザー設定 */}
        <aside className="w-72 border-l border-border flex-shrink-0">
          <EqualizerPanel
            member={selectedMember}
            onUpdateMember={updateMember}
            onUpdateEq={updateEqSettings}
          />
        </aside>
      </main>

      {/* モバイル用レイアウト */}
      <main className="flex-1 flex flex-col md:hidden overflow-hidden">
        {/* モバイルコンテンツエリア */}
        <div className="flex-1 overflow-hidden">
          {/* 成員リストタブ */}
          {mobileTab === "members" && (
            <div className="h-full">
              <MemberList
                members={members}
                selectedMemberId={selectedMemberId}
                onSelectMember={handleMobileSelectMember}
                onAddMember={addMember}
                onDeleteMember={deleteMember}
                onImportCSV={importFromCSV}
                onExportCSV={exportToCSV}
                isMobile
onDeleteAllMembers={handleDeleteAllMembers}
              />
            </div>
          )}

          {/* グラフタブ */}
          {mobileTab === "graph" && (
            <div className="h-full overflow-y-auto p-3">
              <VoiceLevelBar
                members={members}
                selectedMemberId={selectedMemberId}
                onSelectMember={handleMobileSelectMember}
                isMobile
              />
              
              {/* 統計情報 - モバイル用2x2グリッド */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <StatCard
                  label="とても小さい"
                  count={members.filter((m) => m.voiceLevel <= 2).length}
                  color="bg-blue-500"
                  compact
                />
                <StatCard
                  label="小さい〜普通"
                  count={members.filter((m) => m.voiceLevel >= 3 && m.voiceLevel <= 5).length}
                  color="bg-green-500"
                  compact
                />
                <StatCard
                  label="普通〜大きい"
                  count={members.filter((m) => m.voiceLevel >= 6 && m.voiceLevel <= 8).length}
                  color="bg-yellow-500"
                  compact
                />
                <StatCard
                  label="とても大きい"
                  count={members.filter((m) => m.voiceLevel >= 9).length}
                  color="bg-red-500"
                  compact
                />
              </div>

              {/* 演題者リスト - モバイル用 */}
              <div className="mt-3 mixer-panel p-3">
                <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                  演題者
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {members.filter((m) => m.isSpeaker).length === 0 ? (
                    <p className="text-xs text-muted-foreground col-span-full text-center py-3">
                      演題者がいません
                    </p>
                  ) : (
                    members
                      .filter((m) => m.isSpeaker)
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleMobileSelectMember(member.id)}
                          className={cn(
                            "p-2 rounded text-left transition-all text-xs",
                            member.id === selectedMemberId
                              ? "bg-primary/20 ring-1 ring-primary"
                              : "bg-accent/30 active:bg-accent/50"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="truncate">{member.name}</span>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 設定タブ（モバイル） */}
          {mobileTab === "settings" && (
            <div className="h-full">
              <EqualizerPanel
                member={selectedMember}
                onUpdateMember={updateMember}
                onUpdateEq={updateEqSettings}
                isMobile
              />
            </div>
          )}
        </div>

        {/* モバイル用ボトムナビゲーション */}
        <nav className="h-14 border-t border-border bg-card/80 backdrop-blur flex items-center justify-around px-2 flex-shrink-0 safe-area-bottom">
          <MobileNavButton
            icon={Users}
            label="成員"
            isActive={mobileTab === "members"}
            onClick={() => setMobileTab("members")}
            badge={members.length}
          />
          <MobileNavButton
            icon={BarChart3}
            label="グラフ"
            isActive={mobileTab === "graph"}
            onClick={() => setMobileTab("graph")}
          />
          <MobileNavButton
            icon={Sliders}
            label="設定"
            isActive={mobileTab === "settings"}
            onClick={() => setMobileTab("settings")}
            badge={selectedMember ? 1 : 0}
          />
        </nav>
      </main>

      {/* モバイル用設定モーダル */}
      {showMobileSettings && selectedMember && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobileSettings(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-medium text-sm">{selectedMember.name}</span>
              </div>
              <button
                onClick={() => setShowMobileSettings(false)}
                className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-52px)]">
              <EqualizerPanel
                member={selectedMember}
                onUpdateMember={updateMember}
                onUpdateEq={updateEqSettings}
                isMobile
                onClose={() => setShowMobileSettings(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// モバイルナビゲーションボタン
function MobileNavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 w-16 h-12 rounded-lg transition-all",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground active:bg-accent/50"
      )}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-mono">
            {badge > 9 ? "9+" : badge}
          </div>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

// 統計カードコンポーネント
function StatCard({
  label,
  count,
  color,
  compact,
}: {
  label: string;
  count: number;
  color: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("mixer-panel", compact ? "p-2" : "p-3")}>
      <div className="flex items-center gap-1.5 md:gap-2 mb-1">
        <div className={cn("rounded-full", color, compact ? "w-1.5 h-1.5" : "w-2 h-2")} />
        <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{label}</span>
      </div>
      <div className={cn("font-bold font-mono", compact ? "text-lg" : "text-2xl")}>{count}</div>
    </div>
  );
}
