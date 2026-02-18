import { useState, useEffect, useCallback } from "react";
import { nanoid } from "nanoid";
import type { Member, EqualizerSettings } from "@/types/member";
import { DEFAULT_EQ_SETTINGS, createDefaultMember } from "@/types/member";

const STORAGE_KEY = "sound-manager-members";

/**
 * 成員データの管理フック
 * LocalStorageを使用してデータを永続化
 */
export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // LocalStorageからデータを読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMembers(parsed);
      }
    } catch (error) {
      console.error("Failed to load members from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // データが変更されたらLocalStorageに保存
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
      } catch (error) {
        console.error("Failed to save members to localStorage:", error);
      }
    }
  }, [members, isLoading]);

  // 成員を追加
  const addMember = useCallback((name: string, voiceLevel?: number, isSpeaker?: boolean) => {
    const newMember: Member = {
      ...createDefaultMember(name),
      id: nanoid(),
      voiceLevel: voiceLevel ?? 5,
      isSpeaker: isSpeaker ?? false,
    };
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  }, []);

  // 成員を更新
  const updateMember = useCallback((id: string, updates: Partial<Omit<Member, "id" | "createdAt">>) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? { ...member, ...updates, updatedAt: new Date().toISOString() }
          : member
      )
    );
  }, []);

  // 成員を削除
  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  }, []);

  // イコライザー設定を更新
  const updateEqSettings = useCallback((id: string, eqSettings: Partial<EqualizerSettings>) => {
    setMembers((prev) =>
      prev.map((member) => {
        if (member.id !== id) return member;
        const currentEq = member.eqSettings ?? DEFAULT_EQ_SETTINGS;
        return {
          ...member,
          eqSettings: { ...currentEq, ...eqSettings },
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // CSVからインポート
  const importFromCSV = useCallback((csvContent: string) => {
    const lines = csvContent.trim().split("\n");
    const newMembers: Member[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // ヘッダー行をスキップ（名前,声の大きさ などの場合）
      if (i === 0 && (line.includes("名前") || line.toLowerCase().includes("name"))) {
        continue;
      }

      const parts = line.split(",").map((p) => p.trim());
      const name = parts[0];
      if (!name) continue;

      const voiceLevel = parts[1] ? parseInt(parts[1], 10) : 5;
      const isSpeaker = parts[2] ? parts[2].toLowerCase() === "true" || parts[2] === "1" : false;

      newMembers.push({
        ...createDefaultMember(name),
        id: nanoid(),
        voiceLevel: isNaN(voiceLevel) ? 5 : Math.min(10, Math.max(1, voiceLevel)),
        isSpeaker,
      });
    }

    if (newMembers.length > 0) {
      setMembers((prev) => [...prev, ...newMembers]);
    }

    return newMembers.length;
  }, []);

  // CSVにエクスポート
  const exportToCSV = useCallback(() => {
    const header = "名前,声の大きさ,演題者,低音,中音横幅,中音,高音,音量,メモ";
    const rows = members.map((m) => {
      const eq = m.eqSettings ?? DEFAULT_EQ_SETTINGS;
      return [
        m.name,
        m.voiceLevel,
        m.isSpeaker ? "true" : "false",
        eq.low,
        eq.midWidth,
        eq.mid,
        eq.high,
        eq.volume,
        `"${eq.notes.replace(/"/g, '""')}"`,
      ].join(",");
    });
    return [header, ...rows].join("\n");
  }, [members]);

// ✅ 全メンバー削除（全データクリア）
const deleteAllMembers = useCallback(() => {
  setMembers([]);
  localStorage.removeItem(STORAGE_KEY); // ✅ ローカルストレージも削除（おすすめ）
}, []);

  return {
    members,
    isLoading,
    addMember,
    updateMember,
    deleteMember,
    updateEqSettings,
    importFromCSV,
    exportToCSV,
   deleteAllMembers,
  };
}
