import { useState, useRef, useEffect } from "react";
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
import { Plus, Upload, Download, Search, Mic, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { extractPdfTextDetailed } from "@/lib/pdfText";
import { extractNamesFromText } from "@/lib/nameExtract";

interface MemberListProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  onAddMember: (name: string, voiceLevel?: number, isSpeaker?: boolean) => void;
  onDeleteMember: (id: string) => void;
  onDeleteAllMembers: () => void;
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
  onDeleteAllMembers,
  onImportCSV,
  onExportCSV,
  isMobile = false,
}: MemberListProps) {
  // ===== 基本state =====
  const [searchQuery, setSearchQuery] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberLevel, setNewMemberLevel] = useState(5);
  const [newMemberIsSpeaker, setNewMemberIsSpeaker] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // ===== PDFデバッグ =====
  const [pdfDebugOpen, setPdfDebugOpen] = useState(false);
  const [pdfDebug, setPdfDebug] = useState<{
    method?: string;
    pageCount?: number;
    pages?: any[];
    preview?: string;
    progress?: string;
    textLen?: number;
    rawNames?: string[]; // ✅ 重要
    names?: string[];
  } | null>(null);

  // ===== A: 並び替え（PDF順 / あいうえお順） =====
  const [nameOrder, setNameOrder] = useState<"pdf" | "ja">("pdf");

  // ===== B: 誤爆除外（名前 / ワード） =====
  const [excludeWordInput, setExcludeWordInput] = useState("");

  const [excludedWords, setExcludedWords] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pdf_excluded_words") || "[]");
    } catch {
      return [];
    }
  });

  const [excludedNames, setExcludedNames] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pdf_excluded_names") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("pdf_excluded_words", JSON.stringify(excludedWords));
  }, [excludedWords]);

  useEffect(() => {
    localStorage.setItem("pdf_excluded_names", JSON.stringify(excludedNames));
  }, [excludedNames]);

  const addExcludedWord = () => {
    const w = excludeWordInput.trim();
    if (!w) return;
    if (!excludedWords.includes(w)) setExcludedWords((prev) => [...prev, w]);
    setExcludeWordInput("");
  };

  const removeExcludedWord = (w: string) => {
    setExcludedWords((prev) => prev.filter((x) => x !== w));
  };

  const addExcludedName = (name: string) => {
    const n = name.trim();
    if (!n) return;
    if (!excludedNames.includes(n)) setExcludedNames((prev) => [...prev, n]);
  };

  const removeExcludedName = (name: string) => {
    setExcludedNames((prev) => prev.filter((x) => x !== name));
  };

  const applyExcludeAndSort = (names: string[]) => {
    const filtered = names
      .map((n) => n.trim())
      .filter(Boolean)
      .filter((n) => !n.startsWith("__"))
      .filter((n) => !excludedNames.includes(n))
      .filter((n) => !excludedWords.some((w) => n.includes(w)));

    if (nameOrder === "ja") {
      return filtered.slice().sort((a, b) => a.localeCompare(b, "ja"));
    }
    return filtered; // PDF出現順
  };

  // ===== UI用 =====
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== 追加 =====
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

  // ===== CSV import =====
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

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ===== CSV export =====
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

  // ===== PDF import =====
  const handlePdfImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setPdfDebugOpen(true);
      setPdfDebug({ progress: "starting…" });

      const res = await extractPdfTextDetailed(file, {
        onProgress: (msg) => {
          setPdfDebug((prev) => ({ ...(prev ?? {}), progress: msg }));
        },
        ocrPerPage: true,
        minCharsPerPage: 20,
        ocrScale: 2.5,
        ocrLang: "jpn",
        tessdataPath: "/tessdata",
      });

      const rawNames = extractNamesFromText(res.text);
      const names = applyExcludeAndSort(rawNames);

      setPdfDebug({
        method: res.method,
        pageCount: res.pageCount,
        pages: res.pages,
        preview: res.debugPreview,
        textLen: res.text.length,
        rawNames,
        names,
        progress: "done",
      });

      if (names.length === 0) {
        toast.error("名前が見つかりませんでした（テキストを確認してください）");
        return;
      }

      const existing = new Set(members.map((m) => m.name.trim()));
      const toAdd = names
        .map((n) => n.trim())
        .filter(Boolean)
        .filter((n) => !existing.has(n));

      if (toAdd.length === 0) {
        toast.message("追加できる新しい名前がありませんでした（全部重複）");
        return;
      }

      toAdd.forEach((name) => onAddMember(name, 5, false));
      toast.success(`PDFから ${toAdd.length} 名を追加しました`);
    } catch (e: any) {
      console.error(e);
      setPdfDebug((prev) => ({
        ...(prev ?? {}),
        progress: `error: ${e?.message ?? String(e)}`,
      }));
      toast.error(`PDFの読み取りに失敗: ${e?.message ?? String(e)}`);
    } finally {
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  return (
    <div className="mixer-panel h-full flex flex-col">
      {/* ヘッダー */}
      <div className={cn("border-b border-border", isMobile ? "p-2" : "p-3")}>
        <div className={cn("flex items-center justify-between", isMobile ? "mb-2" : "mb-3")}>
          <h2
            className={cn(
              "font-semibold text-muted-foreground uppercase tracking-wider font-mono",
              isMobile ? "text-xs" : "text-sm"
            )}
          >
            Members ({members.length})
          </h2>

          <div className="flex gap-1">
            {/* hidden inputs */}
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfImport}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileImport}
            />

            {/* CSVインポート */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")}
              onClick={() => fileInputRef.current?.click()}
              title="CSVインポート"
            >
              <Upload className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </Button>

            {/* PDFインポート */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")}
              onClick={() => pdfInputRef.current?.click()}
              title="PDFから成員を追加"
            >
              <FileText className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </Button>

            {/* CSVエクスポート */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")}
              onClick={handleExport}
              title="CSVエクスポート"
            >
              <Download className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </Button>

            {/* 一括削除 */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(isMobile ? "h-8 w-8" : "h-7 w-7")}
                  title="メンバーを一括削除"
                >
                  <Trash2 className={cn(isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-card border-border max-w-[90vw] md:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>全メンバーを削除</AlertDialogTitle>
                  <AlertDialogDescription>
                    メンバーを全て削除します。復元できません。本当に実行しますか？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDeleteAllMembers();
                      toast.success("全メンバーを削除しました");
                    }}
                    className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    全削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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

                    <Slider
                      value={[newMemberLevel]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([v]) => setNewMemberLevel(v)}
                      className="w-full my-4"
                    />

                    <div className="grid grid-cols-3 text-xs text-muted-foreground mt-1">
                      <span className="justify-self-start">1</span>
                      <span className="justify-self-center">5</span>
                      <span className="justify-self-end">10</span>
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
          <Search
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground",
              isMobile ? "h-4 w-4" : "h-3.5 w-3.5"
            )}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="検索..."
            className={cn("pl-8 bg-input", isMobile ? "h-10 text-base" : "h-8 text-sm")}
          />
        </div>

        {/* PDFデバッグUI */}
        {pdfDebugOpen && (
          <div className="mt-3 rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">PDF取り込みデバッグ</div>
              <button className="text-sm underline" onClick={() => setPdfDebugOpen(false)}>
                閉じる
              </button>
            </div>

            <div className="text-sm space-y-1">
              <div>進捗: {pdfDebug?.progress ?? "-"}</div>
              <div>方式: {pdfDebug?.method ?? "-"}</div>
              <div>ページ数: {pdfDebug?.pageCount ?? "-"}</div>
              <div>抽出文字数: {pdfDebug?.textLen ?? "-"}</div>

              {pdfDebug?.pages?.length ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm underline">ページ別メタ</summary>
                  <pre className="text-xs whitespace-pre-wrap mt-2">
                    {JSON.stringify(pdfDebug.pages, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold">抽出テキスト（先頭2000文字）</div>
              <textarea
                className="w-full h-40 rounded border p-2 text-xs"
                value={pdfDebug?.preview ?? ""}
                readOnly
              />
            </div>

            {/* A + B */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold">
                  抽出された名前（{pdfDebug?.names?.length ?? 0}件）
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground">並び:</span>

                  <Button
                    type="button"
                    variant={nameOrder === "pdf" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setNameOrder("pdf");
                      setPdfDebug((prev) => {
                        if (!prev?.rawNames) return prev;
                        return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                      });
                    }}
                  >
                    PDF順
                  </Button>

                  <Button
                    type="button"
                    variant={nameOrder === "ja" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setNameOrder("ja");
                      setPdfDebug((prev) => {
                        if (!prev?.rawNames) return prev;
                        return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                      });
                    }}
                  >
                    あいうえお
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPdfDebug((prev) => {
                        if (!prev?.rawNames) return prev;
                        return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                      });
                      toast.message("除外・並び替えを再適用しました");
                    }}
                  >
                    再適用
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={excludeWordInput}
                  onChange={(e) => setExcludeWordInput(e.target.value)}
                  placeholder="除外ワード（例：伝道者、富士見…）"
                  className="bg-input h-9 w-[260px] max-w-full"
                  onKeyDown={(e) => e.key === "Enter" && addExcludedWord()}
                />
                <Button type="button" size="sm" onClick={addExcludedWord}>
                  ワード追加
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExcludedWords([]);
                    setExcludedNames([]);
                    toast.message("除外設定をリセットしました");
                    setPdfDebug((prev) => {
                      if (!prev?.rawNames) return prev;
                      return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                    });
                  }}
                >
                  除外リセット
                </Button>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  除外ワード: {excludedWords.length} / 除外名前: {excludedNames.length}
                </div>

                {(excludedWords.length > 0 || excludedNames.length > 0) && (
                  <div className="rounded border p-2 space-y-2">
                    {excludedWords.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {excludedWords.map((w) => (
                          <Button
                            key={w}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              removeExcludedWord(w);
                              setPdfDebug((prev) => {
                                if (!prev?.rawNames) return prev;
                                return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                              });
                            }}
                            title="クリックで削除"
                          >
                            ワード: {w} ✕
                          </Button>
                        ))}
                      </div>
                    )}

                    {excludedNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {excludedNames.map((n) => (
                          <Button
                            key={n}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              removeExcludedName(n);
                              setPdfDebug((prev) => {
                                if (!prev?.rawNames) return prev;
                                return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                              });
                            }}
                            title="クリックで削除"
                          >
                            名前: {n} ✕
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded border p-2 max-h-56 overflow-auto space-y-1">
                {(pdfDebug?.names ?? []).length === 0 ? (
                  <div className="text-xs text-muted-foreground">（0件）</div>
                ) : (
                  (pdfDebug?.names ?? []).map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <div className="text-sm flex-1 truncate">{n}</div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          addExcludedName(n);
                          setPdfDebug((prev) => {
                            if (!prev?.rawNames) return prev;
                            return { ...prev, names: applyExcludeAndSort(prev.rawNames) };
                          });
                        }}
                      >
                        除外
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* リスト */}
      <ScrollArea className="flex-1">
        <div className={cn("space-y-1", isMobile ? "p-2" : "p-2")}>
          {filteredMembers.length === 0 ? (
            <div
              className={cn(
                "text-center text-muted-foreground",
                isMobile ? "py-12 text-base" : "py-8 text-sm"
              )}
            >
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
                    isSelected ? "bg-accent ring-1 ring-primary" : ""
                  )}
                  onClick={() => onSelectMember(member.id)}
                >
                  <div
                    className={cn(
                      "rounded-full flex-shrink-0",
                      isMobile ? "w-3 h-3" : "w-2 h-2",
                      getVoiceLevelDot(member.voiceLevel),
                      isSelected && "animate-pulse shadow-[0_0_6px_currentColor]"
                    )}
                  />
                  <span className={cn("flex-1 truncate", isMobile ? "text-base" : "text-sm")}>
                    {member.name}
                  </span>

                  {member.isSpeaker && (
                    <Mic className={cn("text-primary flex-shrink-0", isMobile ? "h-4 w-4" : "h-3 w-3")} />
                  )}

                  <span
                    className={cn(
                      "text-muted-foreground font-mono flex-shrink-0",
                      isMobile ? "text-sm" : "text-xs"
                    )}
                  >
                    {member.voiceLevel}
                  </span>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "transition-opacity",
                          isMobile ? "h-8 w-8 opacity-100" : "h-6 w-6 opacity-0 group-hover:opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className={cn("text-destructive", isMobile ? "h-4 w-4" : "h-3 w-3")} />
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
