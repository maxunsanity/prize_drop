import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import type { BootstrapData } from "./game/loadBoardData";
import { loadBootstrapData } from "./game/loadBoardData";
import { lineOr } from "./game/textFormat";
import { TEXT_COPY_IDS } from "./game/textCopyIds";
import { MonopolyShell } from "./MonopolyShell";
import { RootErrorBoundary } from "./RootErrorBoundary";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root 없음");

let bootstrap: BootstrapData | undefined;
try {
  bootstrap = loadBootstrapData();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  document.title = "Monopoly — 오류";
  rootEl.textContent = "";
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "padding:20px;font-family:system-ui,sans-serif;max-width:560px;margin:40px auto";
  const p1 = document.createElement("p");
  p1.style.fontWeight = "600";
  p1.textContent =
    "데이터 로드 실패 — CSV·경로를 확인해 줘.";
  const p2 = document.createElement("pre");
  p2.style.whiteSpace = "pre-wrap";
  p2.style.fontSize = "12px";
  p2.textContent = msg;
  wrap.appendChild(p1);
  wrap.appendChild(p2);
  rootEl.appendChild(wrap);
}

if (bootstrap) {
  document.title = lineOr(
    bootstrap.textById,
    TEXT_COPY_IDS.docTitle,
    document.title,
  );

  createRoot(rootEl).render(
    <StrictMode>
      <RootErrorBoundary textById={bootstrap.textById}>
        <MonopolyShell bootstrap={bootstrap} />
      </RootErrorBoundary>
    </StrictMode>,
  );
}
