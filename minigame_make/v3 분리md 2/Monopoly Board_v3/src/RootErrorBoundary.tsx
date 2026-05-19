import { Component, type ErrorInfo, type ReactNode } from "react";

import { lineOr } from "./game/textFormat";
import { TEXT_COPY_IDS } from "./game/textCopyIds";

type Props = {
  children: ReactNode;
  textById: Record<string, string>;
};

type State = { err: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  override state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  override componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error("RootErrorBoundary:", err, info.componentStack);
  }

  override render(): ReactNode {
    const { textById } = this.props;
    if (this.state.err) {
      const title = lineOr(
        textById,
        TEXT_COPY_IDS.errBoundaryTitle,
        "실행 오류 (개발용 표시)",
      );
      const hint = lineOr(
        textById,
        TEXT_COPY_IDS.errBoundaryHint,
        "브라우저 개발자 도구(F12) → Console 탭도 확인해 줘.",
      );
      return (
        <div
          style={{
            padding: 20,
            fontFamily: "system-ui, sans-serif",
            maxWidth: 560,
            margin: "40px auto",
            border: "2px dashed #c00",
            background: "#fff5f5",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 18 }}>{title}</h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 12,
              color: "#600",
            }}
          >
            {String(this.state.err.message)}
            {"\n\n"}
            {String(this.state.err.stack)}
          </pre>
          <p style={{ fontSize: 13, color: "#444" }}>{hint}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
