import type { FC, ReactNode } from "react";

import { PlaylistSourceProvider } from "@features/PlaylistSource";
import { RoomCollectionsSubProvider } from "./providers/RoomCollectionsSubProvider";
import { useStatusWrite } from "./providers/RoomStatusContexts";

export const RoomContentProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { setStatusText } = useStatusWrite();

  return (
    <PlaylistSourceProvider setStatusText={setStatusText}>
      <RoomCollectionsSubProvider>{children}</RoomCollectionsSubProvider>
    </PlaylistSourceProvider>
  );
};
