import type { ReactNode } from "react";

import { ChatInputContext } from "../ChatInputContext";
import { RoomGameContext, type RoomGameContextValue } from "../RoomGameContext";
import {
  RoomRealtimeContext,
  RoomUiContext,
  type RoomRealtimeContextValue,
  type RoomUiContextValue,
} from "../RoomContext";
import {
  PlaylistSourceContext,
  type PlaylistSourceContextValue,
} from "@features/PlaylistSource";
import {
  RoomSessionContext,
  type RoomSessionContextValue,
} from "../RoomSessionContext";
import {
  RoomSessionInternalContext,
  type RoomSessionInternalContextValue,
} from "./RoomSessionInternalContext";
import type { ChatInputContextValue } from "../ChatInputContext";

type RoomSessionContextProviderTreeProps = {
  children: ReactNode;
  values: {
    chatInput: ChatInputContextValue;
    game: RoomGameContextValue;
    internal: RoomSessionInternalContextValue;
    playlist: PlaylistSourceContextValue;
    realtime: RoomRealtimeContextValue;
    session: RoomSessionContextValue;
    ui: RoomUiContextValue;
  };
};

export const RoomSessionContextProviderTree = ({
  children,
  values,
}: RoomSessionContextProviderTreeProps) => (
  <PlaylistSourceContext.Provider value={values.playlist}>
    <RoomSessionContext.Provider value={values.session}>
      <RoomGameContext.Provider value={values.game}>
        <RoomUiContext.Provider value={values.ui}>
          <RoomRealtimeContext.Provider value={values.realtime}>
            <ChatInputContext.Provider value={values.chatInput}>
              <RoomSessionInternalContext.Provider value={values.internal}>
                {children}
              </RoomSessionInternalContext.Provider>
            </ChatInputContext.Provider>
          </RoomRealtimeContext.Provider>
        </RoomUiContext.Provider>
      </RoomGameContext.Provider>
    </RoomSessionContext.Provider>
  </PlaylistSourceContext.Provider>
);
