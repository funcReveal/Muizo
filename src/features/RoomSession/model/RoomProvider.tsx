/**
 * RoomProvider
 *
 * Composes the RoomSession sub-providers. Consumers should use the focused
 * runtime hooks exported from RoomSession instead of the old monolithic
 * RoomContext shape.
 */
import type { FC, ReactNode } from "react";

import { RoomCollectionsSubProvider } from "./providers/RoomCollectionsSubProvider";
import { RoomCreateSubProvider } from "./providers/RoomCreateSubProvider";
import { RoomPlaylistSubProvider } from "./providers/RoomPlaylistSubProvider";
import { RoomSessionCoreProvider } from "./providers/RoomSessionCoreProvider";

export const RoomProvider: FC<{ children: ReactNode }> = ({
  children,
}) => (
  <RoomPlaylistSubProvider>
    <RoomCollectionsSubProvider>
      <RoomSessionCoreProvider>
        <RoomCreateSubProvider>{children}</RoomCreateSubProvider>
      </RoomSessionCoreProvider>
    </RoomCollectionsSubProvider>
  </RoomPlaylistSubProvider>
);
