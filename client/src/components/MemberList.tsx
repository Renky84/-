import { useState, useRef } from "react";
import type { Member } from "@/types/member";
import { VOICE_LEVEL_LABELS } from "@/types/member";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Upload, Download, Search, Mic, Trash2 } from "lucide-react";
import { toast } from "sonner";
import EQKnob from "@/components/EQKnob";

/**
 * Design: Mixer Console Member List
 * - Dark panel with LED indicators
 * - Search/filter functionality
 * - CSV import/export
 * - Mobile responsive
 */

interface MemberListProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  onAddMember: (name: string, voiceLevel?: number, isSpeaker?: boolean) => void;
  onDeleteMember: (id: string) => void;
  onImportCSV: (content: string) => number;
  onExportCSV: () => string;
  isMobile?: boolean;
}

function getVoiceLevelDot(level: number): string {
  if (level <= 2) return "bg-blue-500";
  if (level <= 4) return "bg-cyan-400";
  if (level <= 6) return "bg-green-500";
  if (level <= 8) return "bg-yellow-500";
  return "bg-red-500";
}

export function MemberList({
  members,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  onDeleteMember,
  onImportCSV,
  onExportCSV,
  isMobile = false,
}: MemberListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberLevel, setNewMemberLevel] = useState(5);
  const [newMemberIsSpeaker, setNewMemberIsSpeaker] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      toast.error("名前を入力してください");
      return;
    }
    onAddMember(newMemberName.trim(), newMemberLevel, newMemberIsSpeaker);
    setNewMemberName("");
    setNewMemberLevel(5);
    setNewMemberIsSpeaker(false);
    setIsAddDialogOpen(false);
    toast.success("成員を追加しました");
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const count = onImportCSV(content);
      toast.success(`${count}名の成員をインポートしました`);
    };
    reader.onerror = () => {
      toast.error("ファイルの読み込みに失敗しました");
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    const csv = onExportCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSVをエクスポートしました");
  };

  return (
    <div className="mixer-panel h-full flex flex-col">
      {/* ヘッダー */}
      <div className={cn("border-b border-border", isMobile ? "p-2" : "p-3")}>
        <div className={cn("flex items-center justify-between", isMobile ? "mb-2" : "mb-3")}>
          <h2 className={cn(
            "font-semibold text-muted-foreground uppercase tracking-wider font-mono",
            isMobile ? "text-xs" : "text-sm"
          )}>
            Members ({members.length})
          </h2>
          <div className="flex gap-1">
            {/* インポート */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")}
              onClick={() => fileInputRef.current?.click()}
              title="CSVインポート"
            >
              <Upload className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </Button>
            {/* エクスポート */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")}
              onClick={handleExport}
              title="CSVエクスポート"
            >
              <Download className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </Button>
            {/* 追加 */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")} 
                  title="成員を追加"
                >
                  <Plus className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-[90vw] md:max-w-md">
                <DialogHeader>
                  <DialogTitle>成員を追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">名前</label>
                    <Input
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="名前を入力"
                      className="bg-input"
                      onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                    />
                  </div>
                 <div>
  <label className="text-sm text-muted-foreground mb-1 block">
    声の大きさ: {newMemberLevel} - {VOICE_LEVEL_LABELS[newMemberLevel]?.label}
  </label>

  {newMemberIsSpeaker && (
    <div className="flex justify-center my-4">
      <EQKnob
        value={(newMemberLevel - 1) / 9}
        onChange={(val) => {
          const converted = Math.round(val * 9 + 1);
          setNewMemberLevel(converted);
        }}
      />
    </div>
  )}

  <div className="flex justify-between text-xs text-muted-foreground mt-1">
    <span>1</span>
    <span>5</span>
    <span>10</span>
  </div>

  <p className="text-xs text-muted-foreground mt-1">
    {VOICE_LEVEL_LABELS[newMemberLevel]?.description}
  </p>
</div>
                
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isSpeaker"
                      checked={newMemberIsSpeaker}
                      onChange={(e) => setNewMemberIsSpeaker(e.target.checked)}
                      className="rounded border-border w-5 h-5"
                    />
                    <label htmlFor="isSpeaker" className="text-sm">
                      演題に立つ人（イコライザー設定を有効化）
                    </label>
                  </div>
                  <Button onClick={handleAddMember} className="w-full h-11">
                    追加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 検索 */}
        <div className="relative">
          <Search className={cn(
            "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
            isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
          )} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className={cn("pl-8 bg-input", isMobile ? "h-10 text-base" : "h-8 text-sm")}
          />
        </div>
      </div>

      {/* リスト */}
      <ScrollArea className="flex-1">
        <div className={cn("space-y-1", isMobile ? "p-2" : "p-2")}>
          {filteredMembers.length === 0 ? (
            <div className={cn(
              "text-center text-muted-foreground",
              isMobile ? "py-12 text-base" : "py-8 text-sm"
            )}>
              {members.length === 0 ? (
                <div className="space-y-2">
                  <p>成員がいません</p>
                  <p className={cn(isMobile ? "text-sm" : "text-xs")}>
                    「+」ボタンで追加するか、CSVをインポートしてください
                  </p>
                </div>
              ) : (
                <p>検索結果がありません</p>
              )}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isSelected = member.id === selectedMemberId;
              return (
                <div
                  key={member.id}
                  className={cn(
                    "group flex items-center gap-2 rounded cursor-pointer transition-all",
                    isMobile ? "px-3 py-3 active:bg-accent/70" : "px-2 py-1.5 hover:bg-accent/50",
                    isSelected
                      ? "bg-accent ring-1 ring-primary"
                      : ""
                  )}
                  onClick={() => onSelectMember(member.id)}
                >
                  {/* LED インジケーター */}
                  <div
                    className={cn(
                      "rounded-full flex-shrink-0",
                      isMobile ? "w-3 h-3" : "w-2 h-2",
                      getVoiceLevelDot(member.voiceLevel),
                      isSelected && "animate-pulse shadow-[0_0_6px_currentColor]"
                    )}
                  />
                  {/* 名前 */}
                  <span className={cn(
                    "flex-1 truncate",
                    isMobile ? "text-base" : "text-sm"
                  )}>
                    {member.name}
                  </span>
                  {/* 演題者マーク */}
                  {member.isSpeaker && (
                    <Mic className={cn(
                      "text-primary flex-shrink-0",
                      isMobile ? "h-4 w-4" : "h-3 w-3"
                    )} />
                  )}
                  {/* レベル */}
                  <span className={cn(
                    "text-muted-foreground font-mono flex-shrink-0",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    {member.voiceLevel}
                  </span>
                  {/* 削除ボタン - モバイルでは常に表示 */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "transition-opacity",
                          isMobile 
                            ? "h-8 w-8 opacity-100" 
                            : "h-6 w-6 opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className={cn(
                          "text-destructive",
                          isMobile ? "h-4 w-4" : "h-3 w-3"
                        )} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border max-w-[90vw] md:max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>成員を削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{member.name}」を削除しますか？この操作は取り消せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            onDeleteMember(member.id);
                            toast.success("成員を削除しました");
                          }}
                          className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          削除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
