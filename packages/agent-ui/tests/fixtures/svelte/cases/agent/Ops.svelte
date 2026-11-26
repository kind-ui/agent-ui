<script lang="ts">
  import type { QueueItem } from "@kind-ui/agent-ui";
  import {
    Composer,
    ComposerAttach,
    ComposerInput,
    ComposerSteerMenu,
    ComposerStop,
    ComposerSubmit,
  } from "../../../../../src/svelte/composer/index.js";
  import { Diff } from "../../../../../src/svelte/diff/index.js";
  import { Handoff } from "../../../../../src/svelte/handoff/index.js";
  import {
    Message,
    MessageContent,
    MessageDelivery,
    MessageHeader,
    MessageOutcome,
    MessageRetrying,
  } from "../../../../../src/svelte/message/index.js";
  import { Queue } from "../../../../../src/svelte/queue/index.js";
  import { StepList, StepListItem } from "../../../../../src/svelte/step/index.js";
  import { StepGroup } from "../../../../../src/svelte/step-group/index.js";
  import {
    SubagentContent,
    SubagentIcon,
    SubagentMeta,
    SubagentRoot,
    SubagentTitle,
    SubagentTrigger,
  } from "../../../../../src/svelte/subagent/index.js";
  import { Terminal } from "../../../../../src/svelte/terminal/index.js";
  import { Tool } from "../../../../../src/svelte/tool/index.js";
  import type { agentHost } from "../../../shared/agent.js";
  import { steerQueue } from "../../../shared/composer-steer.js";
  import { after, before } from "../../../shared/diff.js";
  import { handoffs } from "../../../shared/handoff.js";
  import { delivered, retrying } from "../../../shared/message.js";
  import { agentLabels, agents } from "../../../shared/step-group.js";
  import { retryRows } from "../../../shared/tool-retry.js";

  let { host, confirm }: { host: ReturnType<typeof agentHost>; confirm: boolean } = $props();

  const billing = handoffs.billing as (typeof handoffs)[string];
  const requested = (approvalId: string) => ({ approvalId, generation: 1, state: "requested" as const });

  let queue: readonly QueueItem[] = $state.raw(steerQueue);
  const onSend = (id: string, details: { source: string }) =>
    host
      .decide("queue-send")(details)
      .then(() => {
        queue = queue.filter((item) => item.id !== id);
      });
</script>

<div class="flex w-[40rem] flex-col gap-8 p-6"
  ><section id="steer" data-case="composer-steer">
    <Composer
      aria-label="Steer"
      running
      onSubmit={host.submit}
      onStop={host.stop}
      onSteer={host.decide("composer-steer")}
    >
      <ComposerInput aria-label="Steer prompt"
      /><ComposerAttach /><ComposerSubmit /><ComposerSteerMenu /><ComposerStop />
    </Composer>
  </section
  ><section id="next" data-case="queue">
    <Queue label="Next up" items={queue} {onSend} />
  </section
  ><section id="queued" data-case="message">
    <Message
      aria-label="Queued message"
      messageRole="user"
      text={delivered.queued}
      delivery="queued"
      onWithdraw={host.decide("message-withdraw")}
    >
      <MessageHeader>
        <MessageDelivery />
      </MessageHeader
      ><MessageContent>{delivered.queued}</MessageContent>
    </Message>
  </section
  ><section id="retrying" data-case="message">
    <Message aria-label="Retrying answer" status="streaming" text={delivered.answer} retry={retrying}>
      <MessageContent>{delivered.answer}</MessageContent
      ><MessageRetrying
      /><MessageOutcome />
    </Message>
  </section
  ><section id="run" data-case="terminal">
    <Terminal
      command="npm test"
      output=""
      approval={requested("run")}
      approvalReason
      onApprove={host.decide("terminal-approve")}
      onDeny={host.decide("terminal-deny")}
      onAlwaysAllow={host.decide("terminal-always")}
    />
  </section
  ><section id="tool-retry" data-case="tool">
    <Tool {...retryRows.failed} onRetry={host.decide("tool-retry")} />
  </section
  ><section id="diff" data-case="diff">
    <Diff
      file={{ path: "src/values.ts", language: "ts" }}
      {before}
      {after}
      agentConfirm={confirm}
      onAccept={host.decide("diff-accept")}
      onRevert={host.decide("diff-revert")}
    />
  </section
  ><section id="group" data-case="step-group">
    <StepGroup items={agents} groupLabels={agentLabels} onCancel={host.decide("group-cancel")}
      ><StepList aria-label="Agents"
        >{#each agents as row (row.id)}<SubagentRoot agentName={row.name} status={row.status} agentConfirm={false}
            ><StepListItem value={row.id}
              >{#snippet render({ props }: { props: Record<string, unknown> })}<SubagentTrigger {...props}
                  ><SubagentIcon
                  /><SubagentTitle
                  /><SubagentMeta
                /></SubagentTrigger
              >{/snippet}</StepListItem
            ><SubagentContent
              ><p>{row.task}</p></SubagentContent
            ></SubagentRoot
          >{/each}</StepList
      ></StepGroup
    >
  </section
  ><section id="handoff" data-case="handoff">
    <Handoff
      from={billing.from}
      to={billing.to}
      reason={billing.reason}
      status="pending"
      approval={requested("billing")}
      onApprove={host.decide("handoff-approve")}
      onDeny={host.decide("handoff-deny")}
      onAlwaysAllow={host.decide("handoff-always")}
    />
  </section></div
>
