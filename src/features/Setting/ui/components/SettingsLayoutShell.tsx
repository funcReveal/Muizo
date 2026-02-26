import React from "react";

type SettingsLayoutShellProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

const SettingsLayoutShell: React.FC<SettingsLayoutShellProps> = ({
  sidebar,
  children,
}) => {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-4 xl:grid-cols-[300px_minmax(0,1fr)] xl:grid-rows-1 xl:items-start">
      <div className="min-h-0 xl:sticky xl:top-4 xl:self-start">{sidebar}</div>
      <div className="min-h-0 min-w-0">{children}</div>
    </div>
  );
};

export default SettingsLayoutShell;

