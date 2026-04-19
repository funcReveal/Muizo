/**
 * RoomProvider
 *
 * Composes the RoomSession sub-providers. Consumers should use the focused
 * runtime hooks exported from RoomSession instead of the old monolithic
 * RoomContext shape.
 */
import type { FC, ReactNode } from "react";

import { RoomCreateSubProvider } from "./providers/RoomCreateSubProvider";
import { RoomSessionCoreProvider } from "./providers/RoomSessionCoreProvider";

export const RoomProvider: FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RoomSessionCoreProvider>
    <RoomCreateSubProvider>{children}</RoomCreateSubProvider>
  </RoomSessionCoreProvider>
);
