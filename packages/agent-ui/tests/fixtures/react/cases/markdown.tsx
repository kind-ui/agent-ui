import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { CodeBlock } from "../../../../src/react/code-block.js";
import { Markdown } from "../../../../src/react/markdown.js";
import {
  answer,
  deferredHighlight,
  longAnswer,
  recordedEngine,
  unsafe,
  wideTable,
} from "../../shared/markdown.js";

const frame = "m-4 w-[36rem] text-[var(--kind-fg)]";

function Stream() {
  const [{ engine, records }] = useState(recordedEngine);
  const [state, setState] = useState({ source: "", streaming: true });
  useEffect(() => {
    Object.assign(window, {
      kindMarkdown: {
        source: longAnswer,
        records,
        append: (chunk: string) =>
          flushSync(() => setState((current) => ({ ...current, source: current.source + chunk }))),
        finish: () => flushSync(() => setState((current) => ({ ...current, streaming: false }))),
      },
    });
  }, [records]);
  return <Markdown className={frame} source={state.source} streaming={state.streaming} engine={engine} />;
}

function Highlighted() {
  const [{ highlight, requests }] = useState(deferredHighlight);
  const [code, setCode] = useState("const a = 1;");
  useEffect(() => {
    Object.assign(window, {
      kindCode: { requests, setCode: (next: string) => flushSync(() => setCode(next)) },
    });
  }, [requests]);
  return <CodeBlock aria-label="Code" className={frame} code={code} lang="ts" highlight={highlight} />;
}

function Streaming() {
  const [code, setCode] = useState("");
  useEffect(() => {
    Object.assign(window, {
      kindCode: { append: (chunk: string) => flushSync(() => setCode((current) => current + chunk)) },
    });
  }, []);
  return <CodeBlock aria-label="Code" className={frame} code={code} lang="ts" streaming lineNumbers />;
}

export const cases = {
  stream: () => <Stream />,
  answer: () => <Markdown className={frame} source={answer} />,
  unsafe: () => <Markdown className={frame} source={unsafe} />,
  table: () => <Markdown className="m-4 w-80" source={wideTable} />,
  highlight: () => <Highlighted />,
  "code-stream": () => <Streaming />,
};
