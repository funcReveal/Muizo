import { useEffect, useState } from "react";

export const useRoomChatInputState = () => {
  const [messageInput, setMessageInput] = useState("");
  const [chatCooldownUntil, setChatCooldownUntil] = useState<number | null>(
    null,
  );
  const [chatCooldownLeft, setChatCooldownLeft] = useState(0);

  const effectiveChatCooldownLeft = chatCooldownUntil ? chatCooldownLeft : 0;
  const isChatCooldownActive = effectiveChatCooldownLeft > 0;

  // Re-render only when the displayed countdown second changes.
  useEffect(() => {
    if (!chatCooldownUntil) return;

    let timerId: number | null = null;

    const tick = () => {
      const diff = chatCooldownUntil - Date.now();
      if (diff <= 0) {
        setChatCooldownLeft(0);
        setChatCooldownUntil(null);
        timerId = null;
        return;
      }

      const nextSec = Math.ceil(diff / 1000);
      setChatCooldownLeft(nextSec);
      const msToNextBoundary = diff - (nextSec - 1) * 1000;
      timerId = window.setTimeout(tick, Math.max(50, msToNextBoundary));
    };

    tick();
    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [chatCooldownUntil]);

  return {
    chatCooldownLeft,
    effectiveChatCooldownLeft,
    isChatCooldownActive,
    messageInput,
    setChatCooldownLeft,
    setChatCooldownUntil,
    setMessageInput,
  };
};

export default useRoomChatInputState;
