import React from "react";

import { RoomSessionProvider, SitePresenceProvider } from "@features/RoomSession";
import RoomAwareLayoutShell from "./RoomAwareLayoutShell";

const RoomSessionLayoutShell: React.FC = () => (
  <SitePresenceProvider>
    <RoomSessionProvider>
      <RoomAwareLayoutShell />
    </RoomSessionProvider>
  </SitePresenceProvider>
);

export default RoomSessionLayoutShell;
