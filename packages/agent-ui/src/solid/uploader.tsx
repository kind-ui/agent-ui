import { uploaderPrimitive } from "@kind-ui/agent-ui/core";
import type { ComponentProps } from "@solidjs/web";
import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/solid/file-input";
import { createParts } from "@ui-sdk/solid/primitive";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/solid/progress";
import { For } from "solid-js";

const parts = createParts(uploaderPrimitive, { root: "div", list: "ul", item: "li", action: "button" });

export type UploaderProps = Omit<ComponentProps<typeof parts.Root>, "children">;

/**
 * A File Input drop zone with a Browse button, then a row per item with its progress, and Cancel or Retry when the
 * host offers them. Name it with `aria-label`.
 */
export function Uploader(props: UploaderProps) {
  return (
    <parts.Root {...props}>
      {(state) => (
        <>
          <FileInput {...state.fileInput}>
            <FileInputDropzone>
              <span data-upload-icon="" />
              <span data-hint="">Drop files here, or</span>
              <FileInputTrigger>browse</FileInputTrigger>
            </FileInputDropzone>
          </FileInput>
          <parts.List>
            {(list) => (
              <For each={list.rows} keyed={(row) => row.item.id}>
                {(row) => <UploaderItem value={row().item.id} />}
              </For>
            )}
          </parts.List>
        </>
      )}
    </parts.Root>
  );
}

export type UploaderItemProps = Omit<ComponentProps<typeof parts.Item>, "children">;

/** One upload: the file's name and progress bar, what it's doing, and its action. */
export function UploaderItem(props: UploaderItemProps) {
  return (
    <parts.Item {...props}>
      {(state) => (
        <>
          <span data-icon="" />
          <Progress value={state.item?.progress ?? null}>
            <ProgressLabel>{state.item?.name}</ProgressLabel>
            <ProgressTrack>
              <ProgressIndicator />
            </ProgressTrack>
          </Progress>
          <span data-detail="">{state.detail}</span>
          <parts.Action value={props.value} />
        </>
      )}
    </parts.Item>
  );
}
