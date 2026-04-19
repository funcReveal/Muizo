import React from "react";

import { RoomSessionProvider } from "@features/RoomSession";
import RoomAwareLayoutShell from "./RoomAwareLayoutShell";

const RoomSessionLayoutShell: React.FC = () => (
  <RoomSessionProvider>
    <RoomAwareLayoutShell />
  </RoomSessionProvider>
);

export default RoomSessionLayoutShell;
