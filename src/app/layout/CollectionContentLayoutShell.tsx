import React from "react";
import { Outlet } from "react-router-dom";

import { RoomContentProvider } from "@features/RoomSession";

const CollectionContentLayoutShell: React.FC = () => (
  <RoomContentProvider>
    <Outlet />
  </RoomContentProvider>
);

export default CollectionContentLayoutShell;
