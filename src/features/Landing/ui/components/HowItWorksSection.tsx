import React from "react";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { HOW_IT_WORKS_STEPS } from "../../model/landingContent";

const icons = [
  <MeetingRoomRoundedIcon fontSize="small" />,
  <GraphicEqRoundedIcon fontSize="small" />,
  <EmojiEventsRoundedIcon fontSize="small" />,
];

const HowItWorksSection: React.FC = () => {
  return (
    <section className="landing-info-block landing-info-block-steps">
      <header className="landing-info-header">
        <p className="landing-info-kicker">How It Works</p>
        <h3 className="landing-info-title landing-title-with-icon">
          <AutoAwesomeRoundedIcon fontSize="small" />
          三步驟快速開局
        </h3>
        <p className="landing-info-subtitle">
          建立房間到結算排行，只要三個步驟！
        </p>
      </header>
      <ol className="landing-step-list">
        {HOW_IT_WORKS_STEPS.map((step, index) => (
          <React.Fragment key={step.title}>
            <li className="landing-step-item">
              <span className="landing-step-icon" aria-hidden="true">
                {icons[index % icons.length]}
              </span>
              <div className="landing-step-content">
                <p className="landing-step-title">{step.title}</p>
                <p className="landing-step-desc">{step.description}</p>
              </div>
            </li>
            {index < HOW_IT_WORKS_STEPS.length - 1 && (
              <li className="landing-step-arrow" aria-hidden="true">
                <span className="landing-step-chevron" />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </section>
  );
};

export default HowItWorksSection;
