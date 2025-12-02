import React from "react";

interface HeaderSectionProps {
  serverUrl: string;
  isConnected: boolean;
  displayUsername: string;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  serverUrl,
  isConnected,
  displayUsername,
}) => {
  return (
    <header className="mb-3 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-5xl font-semibold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
          MusicQuiz · Rooms & Chat
        </h1>
        <p className="text-1xl text-slate-400">
          建立房間、邀請朋友，一起即時聊天與出題。
        </p>
      </div>
      <div className="text-right text-shadow-md text-slate-400 space-y-1">
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900/80 border border-slate-700">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          <span className="text-slate-300 text-[11px]">{serverUrl}</span>
        </div>
        <div>
          狀態:
          <span
            className={
              isConnected
                ? "ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/40"
                : "ml-1 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300 border border-red-500/40"
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div>
          使用者:
          <span className="ml-1 font-medium text-slate-200">
            {displayUsername}
          </span>
        </div>
      </div>
    </header>
  );
};

export default HeaderSection;
