import React, { useCallback, useState } from "react";

import CareerActionButton from "../primitives/CareerActionButton";
import CareerSectionHeader from "../primitives/CareerSectionHeader";
import CareerStatePanel from "../primitives/CareerStatePanel";
import CareerWorkbenchShell from "../primitives/CareerWorkbenchShell";

interface CareerShareActionsSectionProps {
  caption: string;
}

const CareerShareActionsSection: React.FC<CareerShareActionsSectionProps> = ({
  caption,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }, [caption]);

  return (
    <CareerWorkbenchShell className="p-4">
      <CareerSectionHeader
        title="快速動作"
        description="先支援文案複製，圖片下載之後再接產圖流程。"
        compact
      />

      <div className="mt-4 grid gap-3">
        <CareerActionButton
          tone="primary"
          className="justify-center rounded-[16px] py-3 text-sm"
          disabled
        >
          下載 PNG
        </CareerActionButton>

        <CareerActionButton
          tone="success"
          className="justify-center rounded-[16px] py-3 text-sm"
          onClick={() => {
            void handleCopyCaption();
          }}
        >
          {copied ? "已複製" : "複製分享文案"}
        </CareerActionButton>
      </div>

      <div className="mt-3">
        <CareerStatePanel className="py-3 text-xs">
          PNG 輸出會等分享卡樣式穩定後再接，目前先把版面與文案流程固定。
        </CareerStatePanel>
      </div>
    </CareerWorkbenchShell>
  );
};

export default CareerShareActionsSection;
