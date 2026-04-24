import React from "react";

import CareerSectionHeader from "../primitives/CareerSectionHeader";
import CareerStatePanel from "../primitives/CareerStatePanel";
import CareerWorkbenchShell from "../primitives/CareerWorkbenchShell";

interface CareerShareCaptionSectionProps {
  caption: string;
  isLoading: boolean;
  error: string | null;
}

const CareerShareCaptionSection: React.FC<CareerShareCaptionSectionProps> = ({
  caption,
  isLoading,
  error,
}) => {
  return (
    <CareerWorkbenchShell className="min-h-0 p-4">
      <CareerSectionHeader
        title="分享文案"
        description="這裡未來可以放多版本文案、社群平台格式與 hashtag。"
        compact
      />

      <div className="mt-4 min-h-0">
        {isLoading ? (
          <CareerStatePanel>載入分享內容中...</CareerStatePanel>
        ) : error ? (
          <CareerStatePanel tone="danger">{error}</CareerStatePanel>
        ) : (
          <div className="h-full min-h-[220px] rounded-[18px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.45)] p-4 text-sm leading-6 text-[var(--mc-text-muted)] xl:min-h-0">
            {caption}
          </div>
        )}
      </div>
    </CareerWorkbenchShell>
  );
};

export default CareerShareCaptionSection;
