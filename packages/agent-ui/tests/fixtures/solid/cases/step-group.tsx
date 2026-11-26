import type { StepStatus } from "@kind-ui/agent-ui";
import { createSignal, For, onSettled, Show } from "solid-js";
import { StepList, StepListItem } from "../../../../src/solid/step.js";
import { StepGroup } from "../../../../src/solid/step-group.js";
import {
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/solid/subagent.js";
import {
  Tool,
  ToolApproval,
  ToolIcon,
  ToolMeta,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/solid/tool.js";
import { expose } from "../../shared/expose.js";
import {
  callOf,
  frames,
  kinds,
  live,
  type StepGroupHandle,
  type StepGroupRow,
  titled,
} from "../../shared/step-group.js";

const noop = () => {};

function Rows(props: { rows: StepGroupRow[]; label: string }) {
  return (
    <StepList aria-label={props.label}>
      <For each={props.rows} keyed={(row) => row.id}>
        {(row) => (
          <Show
            when={row().kind === "agent"}
            fallback={
              <Tool
                call={callOf(row())}
                status={row().status}
                heading={row().title}
                autoOpen="never"
                onApprove={noop}
                onDeny={noop}
              >
                <StepListItem value={row().id} render={ToolTrigger}>
                  <ToolIcon />
                  <ToolTitle />
                  <ToolMeta />
                </StepListItem>
                <ToolApproval />
              </Tool>
            }
          >
            <SubagentRoot agentName={row().title} status={row().status} autoOpen="never">
              <StepListItem value={row().id} render={SubagentTrigger}>
                <SubagentIcon />
                <SubagentTitle />
                <SubagentMeta />
              </StepListItem>
            </SubagentRoot>
          </Show>
        )}
      </For>
    </StepList>
  );
}

const itemsOf = (rows: StepGroupRow[]) =>
  rows.map(({ id, status, kind, target }) => ({ id, status, kind, target }));

function Frames() {
  return (
    <div class="flex w-[36rem] max-w-full flex-col gap-6 p-6">
      <For each={frames}>
        {(frame) => (
          <StepGroup
            id={frame.id}
            items={itemsOf(frame.rows)}
            kinds={kinds}
            status={frame.options?.status}
            durationSeconds={frame.options?.durationSeconds}
            autoOpen={frame.options?.autoOpen}
            label={frame.options?.label}
          >
            <Rows rows={frame.rows} label={`${frame.id} steps`} />
          </StepGroup>
        )}
      </For>
    </div>
  );
}

function Live() {
  const [rows, setRows] = createSignal(live);
  const changes: StepGroupHandle["changes"] = [];
  onSettled(() => {
    const handle: StepGroupHandle = {
      set: (id, status: StepStatus) => {
        setRows((all) => all.map((row) => (row.id === id ? { ...row, status } : row)));
      },
      setAll: (statuses) => {
        setRows((all) => all.map((row) => ({ ...row, status: statuses[row.id] ?? row.status })));
      },
      changes,
    };
    expose({ kindStepGroup: handle });
  });
  return (
    <div class="flex w-[36rem] max-w-full flex-col gap-6 p-6">
      <StepGroup
        id="live"
        items={itemsOf(rows())}
        kinds={kinds}
        durationSeconds={124}
        onOpenChange={(open, details) => changes.push({ open, reason: details.reason })}
      >
        <Rows rows={rows()} label="Agents" />
      </StepGroup>
      <button type="button">After</button>
    </div>
  );
}

function Titles() {
  return (
    <div class="flex w-[36rem] max-w-full flex-col gap-2 p-6">
      <Tool id="titled" call={titled.running} heading={titled.heading} autoOpen="never" />
      <Tool
        id="titled-done"
        call={{ ...titled.running, output: { state: "available", value: "ok" } }}
        heading={titled.heading}
        autoOpen="never"
      />
      <Tool id="bare" call={titled.bare} defaultOpen />
    </div>
  );
}

export const cases = { all: () => <Frames />, live: () => <Live />, titles: () => <Titles /> };
