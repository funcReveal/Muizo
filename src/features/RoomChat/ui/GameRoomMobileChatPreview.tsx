import React, { useMemo } from "react";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import KeyboardDoubleArrowUpRoundedIcon from "@mui/icons-material/KeyboardDoubleArrowUpRounded";
import type { ChatMessage } from "@features/RoomSession";
import { useRoomRealtime } from "@features/RoomSession";
import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";
import {
    formatChatMessageTime,
    formatChatQuestionProgress,
    getChatDisplayName,
} from "./chatMessagePresentation";

const MINI_CHAT_VISIBLE_COUNT = 2;

const isVisibleMiniChatMessage = (message: ChatMessage) => {
    return message.userId !== "system" && !message.userId.startsWith("system:");
};

interface GameRoomMobileChatPreviewProps {
    onOpen: () => void;
}

const GameRoomMobileChatPreview: React.FC<GameRoomMobileChatPreviewProps> = ({
    onOpen,
}) => {
    const { messages } = useRoomRealtime();

    const recentMessages = useMemo(
        () =>
            messages
                .filter(isVisibleMiniChatMessage)
                .slice(-MINI_CHAT_VISIBLE_COUNT),
        [messages],
    );

    const latestMessageId = recentMessages[recentMessages.length - 1]?.id ?? null;

    return (
        <button
            type="button"
            className="game-room-mobile-chat-preview"
            onClick={onOpen}
            aria-label="開啟聊天室"
        >
            <span
                className="game-room-mobile-card-expand-hint game-room-mobile-card-expand-hint--chat"
                aria-hidden="true"
            >
                <KeyboardDoubleArrowUpRoundedIcon fontSize="inherit" />
            </span>
            {recentMessages.length === 0 ? (
                <div className="game-room-mobile-chat-preview__empty">
                    <div className="game-room-mobile-chat-preview__empty-main">
                        <span className="game-room-mobile-chat-preview__empty-icon" aria-hidden="true">
                            <ChatBubbleRoundedIcon fontSize="inherit" />
                        </span>
                        <span className="game-room-mobile-chat-preview__empty-title">
                            尚無訊息
                        </span>
                    </div>

                    <span className="game-room-mobile-chat-preview__empty-subtitle">
                        點開開始聊天
                    </span>
                </div>
            ) : (
                <div
                    key={latestMessageId ?? "empty"}
                    className="game-room-mobile-chat-preview__list"
                >
                    {recentMessages.map((message) => {
                        const questionProgress = formatChatQuestionProgress(message);

                        return (
                            <article
                                key={message.id}
                                className="game-room-mobile-chat-preview__item"
                            >
                                <PlayerAvatar
                                    username={message.username}
                                    clientId={message.userId}
                                    avatarUrl={message.avatarUrl ?? undefined}
                                    size={28}
                                    hideRankMark
                                    effectLevel="simple"
                                />

                                <div className="game-room-mobile-chat-preview__bubble">
                                    <div className="game-room-mobile-chat-preview__meta">
                                        <strong>{getChatDisplayName(message)}</strong>
                                        <span>{formatChatMessageTime(message.timestamp)}</span>
                                        {questionProgress ? (
                                            <span className="game-room-mobile-chat-preview__progress">
                                                {questionProgress}
                                            </span>
                                        ) : null}
                                    </div>

                                    <p>{message.content}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </button>
    );
};

export default React.memo(GameRoomMobileChatPreview);