# 音響管理アプリ (Sound Manager)

会衆の成員の声の大きさを管理し、個人ごとのイコライザー設定を保存するためのWebアプリケーションです。

## 機能

- **成員管理**: 名前の手動入力 + CSVインポート/エクスポート
- **声の大きさ評価**: 1〜10の10段階評価（各段階に説明付き）
- **視覚的なグラフ**: 青（小さい）〜赤（大きい）のグラデーションバーで声の大きさを可視化
- **イコライザー設定**: 演題者ごとに低音・中音横幅・中音・高音・音量を保存
- **レスポンシブデザイン**: PC・スマートフォン両対応
- **データ保存**: ブラウザのLocalStorageに自動保存

## 技術スタック

- **React 19** + **TypeScript**
- **Vite** (ビルドツール)
- **Tailwind CSS 4** (スタイリング)
- **shadcn/ui** (UIコンポーネント)
- **Wouter** (ルーティング)
- **Lucide React** (アイコン)

## セットアップ

### 必要な環境

- **Node.js** 18以上
- **npm** または **pnpm**

### インストール

```bash
# リポジトリをクローン or ZIPを展開後、ディレクトリに移動
cd sound-manager-standalone

# 依存関係をインストール
npm install
# または
pnpm install
```

### 開発サーバーの起動

```bash
npm run dev
# または
pnpm dev
```

ブラウザで `http://localhost:3000` を開いてください。

### ビルド（本番用）

```bash
npm run build
# または
pnpm build
```

ビルド結果は `dist/` ディレクトリに出力されます。

### プレビュー（ビルド後の確認）

```bash
npm run preview
# または
pnpm preview
```

## デプロイ

ビルド後の `dist/` ディレクトリの内容を、任意の静的ホスティングサービスにデプロイできます。

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

Netlifyダッシュボードで以下を設定：
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### GitHub Pages

`dist/` ディレクトリの内容をGitHub Pagesにデプロイしてください。

## ファイル構成

```
sound-manager-standalone/
├── client/
│   ├── index.html              # エントリーHTML
│   ├── public/                 # 静的アセット
│   └── src/
│       ├── main.tsx            # Reactエントリーポイント
│       ├── App.tsx             # ルーティング・レイアウト
│       ├── index.css           # グローバルスタイル・テーマ
│       ├── components/
│       │   ├── EqualizerPanel.tsx   # イコライザー設定パネル
│       │   ├── MemberList.tsx       # 成員リスト
│       │   ├── VoiceLevelBar.tsx    # 声の大きさグラフ
│       │   ├── ErrorBoundary.tsx    # エラーハンドリング
│       │   └── ui/                  # shadcn/ui コンポーネント
│       ├── contexts/
│       │   └── ThemeContext.tsx      # テーマ管理
│       ├── hooks/
│       │   ├── useMembers.ts        # 成員データ管理
│       │   ├── useMobile.tsx        # モバイル判定
│       │   ├── useComposition.ts    # IME入力対応
│       │   └── usePersistFn.ts      # 関数永続化
│       ├── lib/
│       │   └── utils.ts             # ユーティリティ
│       ├── pages/
│       │   ├── Home.tsx             # メインページ
│       │   └── NotFound.tsx         # 404ページ
│       └── types/
│           └── member.ts            # 型定義
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## カスタマイズ

### テーマの変更

`client/src/index.css` の CSS変数を編集してください。

### 声の大きさの基準変更

`client/src/types/member.ts` の `VOICE_LEVEL_LABELS` を編集してください。

### イコライザー帯域の変更

`client/src/components/EqualizerPanel.tsx` のフェーダー設定を編集してください。

## ライセンス

MIT
