import React from "react";

import {
  RoomContentProvider,
  RoomSessionProvider,
  SitePresenceProvider,
} from "@features/RoomSession";
import RoomAwareLayoutShell from "./RoomAwareLayoutShell";

const RoomSessionLayoutShell: React.FC = () => (
  <SitePresenceProvider>
    <RoomContentProvider>
      <RoomSessionProvider>
        <RoomAwareLayoutShell />
      </RoomSessionProvider>
    </RoomContentProvider>
  </SitePresenceProvider>
);

export default RoomSessionLayoutShell;
