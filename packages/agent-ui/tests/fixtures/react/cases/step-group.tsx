import type { StepStatus } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { StepList, StepListItem } from "../../../../src/react/step.js";
import { StepGroup } from "../../../../src/react/step-group.js";
import {
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/react/subagent.js";
import {
  Tool,
  ToolApproval,
  ToolIcon,
  ToolMeta,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/react/tool.js";
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

function Rows({ rows, label }: { rows: StepGroupRow[]; label: string }) {
  return (
    <StepList aria-label={label}>
      {rows.map((row) =>
        row.kind === "agent" ? (
          <SubagentRoot key={row.id} agentName={row.title} status={row.status} autoOpen="never">
            <StepListItem value={row.id} render={<SubagentTrigger />}>
              <SubagentIcon />
              <SubagentTitle />
              <SubagentMeta />
            </StepListItem>
          </SubagentRoot>
        ) : (
          <Tool
            key={row.id}
            call={callOf(row)}
            status={row.status}
            heading={row.title}
            autoOpen="never"
            onApprove={noop}
            onDeny={noop}
          >
            <StepListItem value={row.id} render={<ToolTrigger />}>
              <ToolIcon />
              <ToolTitle />
              <ToolMeta />
            </StepListItem>
            <ToolApproval />
          </Tool>
        ),
      )}
    </StepList>
  );
}

const itemsOf = (rows: StepGroupRow[]) =>
  rows.map(({ id, status, kind, target }) => ({ id, status, kind, target }));

function Frames() {
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-6 p-6">
      {frames.map((frame) => (
        <StepGroup key={frame.id} id={frame.id} items={itemsOf(frame.rows)} kinds={kinds} {...frame.options}>
          <Rows rows={frame.rows} label={`${frame.id} steps`} />
        </StepGroup>
      ))}
    </div>
  );
}

function Live() {
  const [rows, setRows] = useState(live);
  const [changes] = useState<StepGroupHandle["changes"]>([]);
  useEffect(() => {
    const handle: StepGroupHandle = {
      set: (id: string, status: StepStatus) =>
        setRows((all) => all.map((row) => (row.id === id ? { ...row, status } : row))),
      setAll: (statuses) =>
        setRows((all) => all.map((row) => ({ ...row, status: statuses[row.id] ?? row.status }))),
      changes,
    };
    Object.assign(window, { kindStepGroup: handle });
  }, [changes]);
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-6 p-6">
      <StepGroup
        id="live"
        items={itemsOf(rows)}
        kinds={kinds}
        durationSeconds={124}
        onOpenChange={(open, details) => changes.push({ open, reason: details.reason })}
      >
        <Rows rows={rows} label="Agents" />
      </StepGroup>
      <button type="button">After</button>
    </div>
  );
}

function Titles() {
  return (
    <div className="flex w-[36rem] max-w-full flex-col gap-2 p-6">
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
