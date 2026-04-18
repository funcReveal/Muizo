import React, { useMemo } from "react";
import { useRoomRealtime } from "@features/RoomSession";
import useGameRoomDanmu from "../../model/useGameRoomDanmu";
import { DanmuContext, DanmuItemsContext } from "@features/RoomChat/model/DanmuContext";

const GameRoomDanmuProviderBridge: React.FC<{
    roomId: string;
    children: React.ReactNode;
}> = ({ roomId, children }) => {
    const { messages } = useRoomRealtime();
    const { danmuEnabled, setDanmuEnabled, danmuItems } = useGameRoomDanmu({
        roomId,
        messages,
    });

    const danmuContextValue = useMemo(
        () => ({
            danmuEnabled,
            onDanmuEnabledChange: setDanmuEnabled,
        }),
        [danmuEnabled, setDanmuEnabled],
    );

    const danmuItemsValue = useMemo(() => danmuItems, [danmuItems]);

    return (
        <DanmuContext.Provider value={danmuContextValue}>
            <DanmuItemsContext.Provider value={danmuItemsValue}>
                {children}
            </DanmuItemsContext.Provider>
        </DanmuContext.Provider>
    );
};

export default React.memo(GameRoomDanmuProviderBridge);
