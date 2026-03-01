import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

interface LoginPageProps {
  usernameInput: string;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onGoogleLogin: () => void;
  googleLoading?: boolean;
  nicknameMaxLength?: number;
}

const rotatingWords = ["華語流行", "迷因 meme", "遊戲 BGM", "J-POP", "K-POP"];

const TYPING_SPEED_MS = 95;
const DELETING_SPEED_MS = 60;
const HOLD_AFTER_TYPED_MS = 3000;
const HOLD_AFTER_DELETED_MS = 220;

const LoginPage: React.FC<LoginPageProps> = ({
  usernameInput,
  onInputChange,
  onConfirm,
  onGoogleLogin,
  googleLoading = false,
  nicknameMaxLength = 16,
}) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const maxWordLength = useMemo(
    () => rotatingWords.reduce((max, word) => Math.max(max, word.length), 0),
    [],
  );

  const activeWord = rotatingWords[wordIndex];
  const visibleWord = activeWord.slice(0, typedLength);

  useEffect(() => {
    const isFullyTyped = typedLength === activeWord.length;
    const isFullyDeleted = typedLength === 0;
    let delay = isDeleting ? DELETING_SPEED_MS : TYPING_SPEED_MS;

    if (!isDeleting && isFullyTyped) {
      delay = HOLD_AFTER_TYPED_MS;
    } else if (isDeleting && isFullyDeleted) {
      delay = HOLD_AFTER_DELETED_MS;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && isFullyTyped) {
        setIsDeleting(true);
        return;
      }
      if (isDeleting && isFullyDeleted) {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        return;
      }
      setTypedLength((prev) => prev + (isDeleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeWord.length, isDeleting, typedLength]);

  return (
    <section className="mq-auth-shell relative overflow-hidden p-5 sm:p-6 lg:p-8">
      <div className="relative grid gap-6 lg:grid-cols-[1.08fr,0.92fr] lg:gap-7">
        <div className="flex min-w-0 flex-col justify-between gap-6">
          <div className="space-y-5">
            <h2 className="mq-auth-title text-[2.15rem] leading-[1.2] text-[var(--mc-text)] sm:text-[2.5rem] lg:text-[3rem]">
              和朋友一起猜
              <span
                className="mq-auth-word-slot"
                style={
                  {
                    "--mq-word-slot-width": `${maxWordLength + 1}ch`,
                  } as CSSProperties
                }
              >
                <span className="mq-auth-word-text">{visibleWord}</span>
                <span className="mq-auth-word-caret" />
              </span>
              <span className="block mq-auth-title-accent">
                秒進房間，直接開始挑戰
              </span>
            </h2>
            <p className="max-w-[92ch] text-[13px] leading-6 text-[var(--mc-text-muted)] sm:text-sm">
              推薦使用 Google
              登入，完整啟用播放清單同步與收藏資料延續。若只想快速試玩，也可以用訪客模式立即加入。
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <article className="mq-auth-card mq-auth-card-google">
            <header className="space-y-3">
              <span className="mq-auth-badge mq-auth-badge-recommended">
                推薦登入
              </span>
              <h3 className="mq-auth-card-title">Google 登入</h3>
              <p className="mq-auth-card-desc">
                你的進度與資料會穩定保存，避免重整後狀態遺失，也能跨裝置無縫延續。
              </p>
            </header>

            <ul className="mq-auth-feature-list">
              <li className="mq-auth-feature-item">
                同步 YouTube 播放清單，快速建立題庫
              </li>
              <li className="mq-auth-feature-item">保留個人收藏與編輯紀錄</li>
              <li className="mq-auth-feature-item">跨裝置延續登入狀態</li>
              <li className="mq-auth-feature-item">新功能優先支援帳號用戶</li>
            </ul>

            <div className="flex h-full flex-col justify-end">
              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={googleLoading}
                className="mq-auth-button mq-auth-button-google cursor-pointer flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-2 ">
                  {googleLoading ? "登入中..." : "透過 Google 登入"}
                </span>
              </button>
            </div>
          </article>

          <article className="mq-auth-card mq-auth-card-guest">
            <header className="space-y-3">
              <span className="mq-auth-badge">快速試玩</span>
              <h3 className="mq-auth-card-title">訪客快速進入</h3>
              <p className="mq-auth-card-desc">
                不綁定帳號，輸入暱稱即可開局。適合臨時開房或短時間測試。
              </p>
            </header>

            <div className="space-y-3">
              <label
                htmlFor="nickname"
                className="text-[11px] uppercase tracking-[0.22em] text-[var(--mc-text-muted)]"
              >
                暱稱
              </label>
              <input
                id="nickname"
                value={usernameInput}
                onChange={(e) =>
                  onInputChange(e.target.value.slice(0, nicknameMaxLength))
                }
                placeholder="例如：Night DJ"
                maxLength={nicknameMaxLength}
                className="mq-auth-input w-full rounded-2xl px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={onConfirm}
                className="mq-auth-button mq-auth-button-guest cursor-pointer w-full rounded-2xl px-4 py-3 text-sm uppercase tracking-[0.18em]"
              >
                以訪客進入
              </button>
            </div>
          </article>
        </div>
      </div>

      <style>
        {`
          .mq-auth-shell {
            font-family: "OpenHuninn", "Noto Sans TC", sans-serif;
            background-color: #000;
          }

          .mq-auth-title {
            font-family: "OpenHuninn", "Noto Sans TC", sans-serif;
            font-weight: 500;
          }

          .mq-auth-title-accent {
            line-height: 1.2;
            padding-top: 0.03em;
            background: linear-gradient(92deg, #f59e0b, #fcd34d);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: 400;
          }

          .mq-auth-word-slot {
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            min-width: var(--mq-word-slot-width);
            height: 1.15em;
            vertical-align: middle;
            margin-inline: 0.2em;
          }

          .mq-auth-word-text {
            color: #8ff3dd;
            text-shadow: 0 0 16px rgba(45, 212, 191, 0.52);
            line-height: 1;
            padding-bottom: 16px;
          }

          .mq-auth-word-caret {
            width: 1px;
            height: 0.9em;
            margin-left: 4px;
            margin-bottom: 10px;
            background: rgba(143, 243, 221, 0.95);
            box-shadow: 0 0 10px rgba(45, 212, 191, 0.7);
            animation: mqCaretBlink 820ms steps(1, end) infinite;
          }

          @keyframes mqCaretBlink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }

          .mq-auth-card {
            min-height: 280px;
            border-radius: 22px;
            border: 1px solid rgba(226, 232, 240, 0.22);
            background: rgba(12, 18, 34, 0.34);
            backdrop-filter: blur(18px) saturate(118%);
            -webkit-backdrop-filter: blur(18px) saturate(118%);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.14),
              inset 0 0 0 1px rgba(255, 255, 255, 0.04),
              0 18px 28px -24px rgba(2, 6, 23, 0.76);
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 16px;
            position: relative;
            overflow: hidden;
          }

          .mq-auth-card::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background:
              radial-gradient(
                120px 90px at 10% 8%,
                rgba(0, 255, 255, 0.18),
                transparent 72%
              ),
              radial-gradient(
                130px 96px at 88% 92%,
                rgba(143, 0, 255, 0.18),
                transparent 74%
              );
            pointer-events: none;
          }

          .mq-auth-card::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 1px solid rgba(255, 255, 255, 0.08);
            pointer-events: none;
            mix-blend-mode: screen;
          }

          .mq-auth-card-google {
            order: 2;
            border-color: rgba(0, 255, 255, 0.4);
            background: rgba(8, 26, 34, 0.32);
            box-shadow:
              inset 0 1px 0 rgba(0, 255, 255, 0.2),
              inset 0 0 0 1px rgba(0, 255, 255, 0.07),
              0 20px 30px -24px rgba(6, 182, 212, 0.28);
          }

          .mq-auth-card-guest {
            order: 1;
            border-color: rgba(251, 191, 36, 0.34);
            background: rgba(30, 20, 10, 0.3);
            box-shadow:
              inset 0 1px 0 rgba(251, 191, 36, 0.2),
              inset 0 0 0 1px rgba(245, 158, 11, 0.08),
              0 18px 28px -24px rgba(245, 158, 11, 0.24);
          }

          .mq-auth-card-guest::before {
            background:
              radial-gradient(
                120px 90px at 92% 10%,
                rgba(245, 158, 11, 0.14),
                transparent 72%
              ),
              radial-gradient(
                120px 90px at 8% 92%,
                rgba(251, 191, 36, 0.12),
                transparent 72%
              );
          }

          .mq-auth-badge {
            display: inline-flex;
            align-items: center;
            border-radius: 999px;
            border: 1px solid rgba(251, 191, 36, 0.35);
            background: rgba(245, 158, 11, 0.12);
            color: rgba(254, 243, 199, 0.94);
            padding: 6px 11px;
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
          }

          .mq-auth-badge-recommended {
            border-color: rgba(0, 255, 255, 0.36);
            background: rgba(0, 255, 255, 0.1);
            color: rgba(207, 250, 254, 0.95);
          }

          .mq-auth-card-title {
            margin: 0;
            font-family: "OpenHuninn", "Noto Sans TC", sans-serif;
            font-size: 1.45rem;
            line-height: 1.2;
            color: var(--mc-text);
          }

          .mq-auth-card-desc {
            margin: 0;
            font-size: 13px;
            line-height: 1.55;
            color: var(--mc-text-muted);
          }

          .mq-auth-feature-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 8px;
          }

          .mq-auth-feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: #c9f9eb;
            line-height: 1.35;
          }

          .mq-auth-feature-item::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: rgba(45, 212, 191, 0.9);
            box-shadow: 0 0 10px rgba(45, 212, 191, 0.75);
            flex: 0 0 auto;
          }

          .mq-auth-input {
            color: var(--mc-text);
            border: 1px solid rgba(245, 158, 11, 0.24);
            background: rgba(24, 18, 13, 0.74);
            transition: border-color 160ms ease, box-shadow 160ms ease;
          }

          .mq-auth-input::placeholder {
            color: rgba(252, 211, 77, 0.36);
          }

          .mq-auth-input:focus {
            outline: none;
            border-color: rgba(251, 191, 36, 0.76);
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.18);
          }

          .mq-auth-button {
            border: 1px solid transparent;
            color: var(--mc-text);
            transition: transform 140ms ease, filter 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
          }

          .mq-auth-button:hover {
            transform: translateY(-1px);
            filter: brightness(1.06);
          }

          .mq-auth-button-guest {
            border-color: rgba(251, 191, 36, 0.44);
            background: rgba(245, 158, 11, 0.22);
            box-shadow: none;
          }

          .mq-auth-button-google {
            color: #eafaf2;
            border-color: rgba(0, 255, 255, 0.4);
            background: rgba(8, 90, 110, 0.54);
            box-shadow: none;
          }

          .mq-auth-button-google:hover {
            box-shadow: none;
          }

          @media (max-width: 640px) {
            .mq-auth-card {
              min-height: unset;
            }
          }
        `}
      </style>
    </section>
  );
};

export default LoginPage;
