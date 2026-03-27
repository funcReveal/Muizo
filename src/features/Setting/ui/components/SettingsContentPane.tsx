import React from "react";

type SettingsContentPaneProps = {
  children: React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
};

const SettingsContentPane: React.FC<SettingsContentPaneProps> = ({
  children,
  scrollContainerRef,
}) => {
  return (
    <section className="h-full min-h-0 min-w-0">
      <div ref={scrollContainerRef} className="h-full min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4 pb-1">{children}</div>
      </div>
    </section>
  );
};

export default SettingsContentPane;
