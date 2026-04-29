import type React from "react";

export const isImeComposingKeyboardEvent = (
  event: React.KeyboardEvent<HTMLElement>,
) => {
  const nativeEvent = event.nativeEvent as KeyboardEvent & {
    isComposing?: boolean;
  };

  return (
    nativeEvent.isComposing === true ||
    event.key === "Process" ||
    event.keyCode === 229
  );
};
