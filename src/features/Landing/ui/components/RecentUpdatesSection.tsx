import React from "react";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import { LANDING_UPDATES } from "../../model/landingContent";

const RecentUpdatesSection: React.FC = () => {
  return (
    <section className="landing-info-block landing-info-block-updates">
      <header className="landing-info-header">
        <p className="landing-info-kicker">Recent Updates</p>
        <h3 className="landing-info-title landing-title-with-icon">
          <NewReleasesRoundedIcon fontSize="small" />
          近期更新
        </h3>
        <p className="landing-info-subtitle">最新改版與功能調整，方便回訪玩家快速掌握。</p>
      </header>
      <ul className="landing-update-list">
        {LANDING_UPDATES.map((item) => (
          <li key={item.title} className="landing-update-item">
            <time className="landing-update-date" dateTime={item.date}>
              <CalendarTodayRoundedIcon
                className="landing-date-icon"
                fontSize="inherit"
              />
              {item.date}
            </time>
            <p className="landing-update-title">{item.title}</p>
            <p className="landing-update-desc">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RecentUpdatesSection;
