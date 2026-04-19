import type { FC, ReactNode } from "react";

import { RoomAuthSubProvider } from "./providers/RoomAuthSubProvider";
import { RoomStatusSubProvider } from "./providers/RoomStatusSubProvider";

export const AuthSessionProvider: FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RoomStatusSubProvider>
    <RoomAuthSubProvider>{children}</RoomAuthSubProvider>
  </RoomStatusSubProvider>
);
