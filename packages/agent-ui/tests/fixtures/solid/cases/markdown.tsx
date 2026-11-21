import { createSignal, flush, onSettled } from "solid-js";
import { CodeBlock } from "../../../../src/solid/code-block.js";
import { Markdown } from "../../../../src/solid/markdown.js";
import { expose } from "../../shared/expose.js";
import {
  answer,
  deferredHighlight,
  longAnswer,
  recordedEngine,
  unsafe,
  wideTable,
} from "../../shared/markdown.js";

const frame = "m-4 w-[36rem] text-[var(--kind-color-fg)]";

function Stream() {
  const { engine, records } = recordedEngine();
  const [source, setSource] = createSignal("");
  const [streaming, setStreaming] = createSignal(true);
  onSettled(() =>
    expose({
      kindMarkdown: {
        source: longAnswer,
        records,
        append: (chunk: string) => {
          setSource((current) => current + chunk);
          flush();
        },
        finish: () => {
          setStreaming(false);
          flush();
        },
      },
    }),
  );
  return <Markdown class={frame} source={source()} streaming={streaming()} engine={engine} />;
}

function Highlighted() {
  const { highlight, requests } = deferredHighlight();
  const [code, setCode] = createSignal("const a = 1;");
  onSettled(() =>
    expose({
      kindCode: {
        requests,
        setCode: (next: string) => {
          setCode(next);
          flush();
        },
      },
    }),
  );
  return <CodeBlock aria-label="Code" class={frame} code={code()} language="ts" highlight={highlight} />;
}

function Streaming() {
  const [code, setCode] = createSignal("");
  onSettled(() =>
    expose({
      kindCode: {
        append: (chunk: string) => {
          setCode((current) => current + chunk);
          flush();
        },
      },
    }),
  );
  return <CodeBlock aria-label="Code" class={frame} code={code()} language="ts" streaming lineNumbers />;
}

export const cases = {
  stream: () => <Stream />,
  answer: () => <Markdown class={frame} source={answer} />,
  unsafe: () => <Markdown class={frame} source={unsafe} />,
  table: () => <Markdown class="m-4 w-80" source={wideTable} />,
  highlight: () => <Highlighted />,
  "code-stream": () => <Streaming />,
};
