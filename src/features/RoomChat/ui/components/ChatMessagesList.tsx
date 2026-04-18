import React from "react";
import type { ChatMessage } from "@features/RoomSession";
import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";
import {
    formatChatMessageTime,
    formatChatQuestionProgress,
    getChatDisplayName,
} from "../chatMessagePresentation";

interface ChatMessagesListProps {
    messages: ChatMessage[];
    clientId: string;
    setScrollNodeRef: (node: HTMLDivElement | null) => void;
}

const ChatMessagesList: React.FC<ChatMessagesListProps> = ({
    messages,
    clientId,
    setScrollNodeRef,
}) => {
    if (messages.length === 0) {
        return (
            <div
                ref={setScrollNodeRef}
                className="floating-chat-messages mq-autohide-scrollbar"
            >
                <div className="floating-chat-empty">
                    <span className="floating-chat-empty-dot" aria-hidden="true" />
                    <span>目前還沒有新訊息</span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setScrollNodeRef}
            className="floating-chat-messages mq-autohide-scrollbar"
        >
            {messages.map((msg) => {
                const isSystemMessage = msg.userId === "system" || msg.userId.startsWith("system:");
                const isPresence = msg.userId === "system:presence";

                if (isPresence) {
                    return (
                        <div key={msg.id} className="floating-chat-msg floating-chat-msg--presence">
                            <span className="floating-chat-msg-name">{msg.content}</span>
                            <span className="floating-chat-msg-time">
                                {formatChatMessageTime(msg.timestamp)}
                            </span>
                        </div>
                    );
                }

                const isMine = msg.userId === clientId;
                const questionProgress = formatChatQuestionProgress(msg);

                return (
                    <div
                        key={msg.id}
                        className={`floating-chat-msg${isMine ? " floating-chat-msg--mine" : ""}`}
                    >
                        <div className="floating-chat-msg-row">
                            {!isSystemMessage ? (
                                <div className="floating-chat-msg-avatar">
                                    <PlayerAvatar
                                        username={msg.username}
                                        clientId={msg.userId}
                                        avatarUrl={msg.avatarUrl ?? undefined}
                                        size={30}
                                        isMe={isMine}
                                        hideRankMark
                                        effectLevel="simple"
                                    />
                                </div>
                            ) : null}
                            <div className="floating-chat-msg-content">
                                <div className="floating-chat-msg-meta">
                                    <span className="floating-chat-msg-name">{getChatDisplayName(msg)}</span>
                                    <span className="floating-chat-msg-time">
                                        {formatChatMessageTime(msg.timestamp)}
                                    </span>
                                    {questionProgress ? (
                                        <span className="floating-chat-msg-progress">{questionProgress}</span>
                                    ) : null}
                                </div>
                                <p className="floating-chat-msg-body">{msg.content}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(ChatMessagesList);
