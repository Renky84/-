/**
 * 成員データの型定義
 * 音響管理アプリで使用する成員情報とイコライザー設定
 */

export interface EqualizerSettings {
  /** 低音 (Low) -12 to +12 dB */
  low: number;
  /** 中音の横幅 (Mid Width/Q) 0.1 to 10 */
  midWidth: number;
  /** 中音 (Mid) -12 to +12 dB */
  mid: number;
  /** 高音 (High) -12 to +12 dB */
  high: number;
  /** 全体音量 -∞ to +10 dB, represented as -60 to +10 */
  volume: number;
  /** 自由メモ */
  notes: string;
}

export interface Member {
  /** 一意のID */
  id: string;
  /** 成員の名前 */
  name: string;
  /** 声の大きさ (1-10) */
  voiceLevel: number;
  /** イコライザー設定（演題に立つ人のみ） */
  eqSettings?: EqualizerSettings;
  /** 演題に立つ人かどうか */
  isSpeaker: boolean;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/** 声の大きさのラベル定義 */
export const VOICE_LEVEL_LABELS: Record<number, { label: string; description: string }> = {
  1: { label: "とても小さい", description: "ほとんど聞こえない" },
  2: { label: "かなり小さい", description: "注意して聞く必要がある" },
  3: { label: "小さい", description: "静かな環境でないと聞き取りにくい" },
  4: { label: "やや小さい", description: "普通より少し小さい" },
  5: { label: "普通", description: "標準的な声量" },
  6: { label: "普通〜やや大きい", description: "標準的〜やや大きめ" },
  7: { label: "やや大きい", description: "普通より少し大きい" },
  8: { label: "大きい", description: "はっきりと聞こえる" },
  9: { label: "かなり大きい", description: "音量調整が必要な場合がある" },
  10: { label: "とても大きい", description: "音量を下げる必要がある" },
};

/** デフォルトのイコライザー設定 */
export const DEFAULT_EQ_SETTINGS: EqualizerSettings = {
  low: 0,
  midWidth: 1,
  mid: 0,
  high: 0,
  volume: 0,
  notes: "",
};

/** 新規成員のデフォルト値 */
export const createDefaultMember = (name: string): Omit<Member, "id"> => ({
  name,
  voiceLevel: 5,
  isSpeaker: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
