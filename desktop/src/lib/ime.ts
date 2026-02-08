import type { KeyboardEvent as ReactKeyboardEvent, MutableRefObject } from "react";

type ImeNativeKeyboardEvent = KeyboardEvent & {
  isComposing?: boolean;
  keyCode?: number;
};

export const isImeComposing = (
  e: ReactKeyboardEvent<Element>,
  isComposingRef?: MutableRefObject<boolean>
) => {
  const nativeEvent = e.nativeEvent as ImeNativeKeyboardEvent;
  return (
    nativeEvent.isComposing ||
    nativeEvent.keyCode === 229 ||
    isComposingRef?.current === true
  );
};
