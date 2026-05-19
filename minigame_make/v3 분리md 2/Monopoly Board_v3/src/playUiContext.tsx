import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
} from "react";

export type PlayUiValue = {
  autoRoll: boolean;
  setAutoRoll: Dispatch<SetStateAction<boolean>>;
  autoRollRef: MutableRefObject<boolean>;
};

const PlayUiContext = createContext<PlayUiValue | null>(null);

export function PlayUiProvider(props: { children: ReactNode }): ReactElement {
  const { children } = props;
  const [autoRoll, setAutoRoll] = useState(false);
  const autoRollRef = useRef(false);
  autoRollRef.current = autoRoll;
  const value = useMemo(
    () => ({ autoRoll, setAutoRoll, autoRollRef }),
    [autoRoll],
  );
  return (
    <PlayUiContext.Provider value={value}>{children}</PlayUiContext.Provider>
  );
}

export function usePlayUi(): PlayUiValue {
  const v = useContext(PlayUiContext);
  if (!v) throw new Error("usePlayUi: PlayUiProvider 밖에서 사용됨");
  return v;
}
