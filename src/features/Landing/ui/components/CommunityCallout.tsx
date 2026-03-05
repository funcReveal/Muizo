import React from "react";
import BuildCircleRoundedIcon from "@mui/icons-material/BuildCircleRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

const CommunityCallout: React.FC = () => {
  const discordInviteUrl =
    import.meta.env.VITE_DISCORD_INVITE_URL?.trim() ?? "";
  const hasDiscordLink = discordInviteUrl.length > 0;

  return (
    <section className="landing-community-callout">
      <div className="landing-community-main">
        <div className="landing-community-header">
          <p className="landing-community-kicker">
            <BuildCircleRoundedIcon fontSize="inherit" />
            In Active Development
          </p>
          <h3 className="landing-community-title">
            產品持續開發中，歡迎一起把 Muizo 做得更好
          </h3>
          <p className="landing-community-copy">
            我們每週都會根據玩家回饋調整體驗。如果你想提出建議、回報問題，或有合作想法，歡迎加入
            Discord 社群一起討論。
          </p>

          <div className="landing-community-tags" aria-hidden="true">
            <span className="landing-community-tag">
              <ForumRoundedIcon fontSize="inherit" />
              回饋建議
            </span>
            <span className="landing-community-tag">
              <RocketLaunchRoundedIcon fontSize="inherit" />
              功能共創
            </span>
            <span className="landing-community-tag">
              <HandshakeRoundedIcon fontSize="inherit" />
              合作交流
            </span>
          </div>
        </div>

        <aside className="landing-community-panel">
          <div className="landing-community-panel-icon" aria-hidden="true">
            <Diversity3RoundedIcon fontSize="inherit" />
          </div>
          <p className="landing-community-panel-title">加入 Discord 社群</p>
          <p className="landing-community-panel-copy">
            搶先收到更新消息，也歡迎直接提出你想要的功能與玩法。
          </p>

          {hasDiscordLink ? (
            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noreferrer"
              className="landing-community-cta"
            >
              立即加入 Discord
              <ArrowOutwardRoundedIcon fontSize="inherit" />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="landing-community-cta is-disabled"
            >
              Discord 邀請連結準備中
            </button>
          )}
        </aside>
      </div>
    </section>
  );
};

export default CommunityCallout;
