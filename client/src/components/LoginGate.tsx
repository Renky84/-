import { useMemo, useState } from "react";

const STORAGE_KEY = "sound_manager_logged_in";

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = useMemo(() => {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }, []);

  if (isLoggedIn) return <>{children}</>;

  const correct = import.meta.env.VITE_APP_PASSWORD;

  const onLogin = () => {
    if (!correct) {
      setError("環境変数 VITE_APP_PASSWORD が未設定です（.env を確認）");
      return;
    }
    if (password === correct) {
      localStorage.setItem(STORAGE_KEY, "1");
      location.reload(); // いちばん確実に状態反映
      return;
    }
    setError("パスワードが違います");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="mixer-panel w-full max-w-sm p-5 space-y-4">
        <div className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
          Login
        </div>

        <label className="text-sm text-muted-foreground">パスワード</label>
        <input
          className="bg-input border border-border rounded px-3 py-2 w-full"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && onLogin()}
          placeholder="入力してください"
        />

        {error && <div className="text-sm text-destructive">{error}</div>}

        <button
          className="mixer-button w-full"
          onClick={onLogin}
        >
          ログイン
        </button>

        <div className="text-xs text-muted-foreground">
          ※内輪用の簡易ログインです
        </div>
      </div>
    </div>
  );
}