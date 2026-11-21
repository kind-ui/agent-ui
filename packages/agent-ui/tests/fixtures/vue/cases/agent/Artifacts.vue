<script setup lang="ts">
import { Action } from "../../../../../src/vue/action.js";
import { Document } from "../../../../../src/vue/document.js";
import { FileTree } from "../../../../../src/vue/file-tree.js";
import { GeneratedImage } from "../../../../../src/vue/generated-image.js";
import { InlineCitation } from "../../../../../src/vue/inline-citation.js";
import { Selection } from "../../../../../src/vue/selection.js";
import { Sources } from "../../../../../src/vue/sources.js";
import { StackTrace } from "../../../../../src/vue/stack-trace.js";
import { Terminal } from "../../../../../src/vue/terminal.js";
import { TestResults } from "../../../../../src/vue/test-results.js";
import { Transcript } from "../../../../../src/vue/transcript.js";
import { selectionActions } from "../../../shared/agent.js";
import { downloads, readme } from "../../../shared/document.js";
import { entries } from "../../../shared/file-tree.js";
import { lighthouse, size } from "../../../shared/generated-image.js";
import { sources } from "../../../shared/sources.js";
import { typeErrorStack } from "../../../shared/stack-trace.js";
import { installRun } from "../../../shared/terminal.js";
import { suites } from "../../../shared/test-results.js";
import { standup } from "../../../shared/transcript.js";
import { type Details, host } from "./host.js";

const change = (component: string) => (_value: unknown, details: Details) => host.change(component, details);
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="sources">
      <Sources id="sources" :sources="sources" :onOpenChange="change('sources')" />
    </section>
    <section data-case="inline-citation">
      <p>
        Back off when you hit a limit
        <InlineCitation id="citation" :sources="sources" :onOpenChange="change('citation')" />.
      </p>
    </section>
    <section data-case="document">
      <Document
        id="document"
        label="README.md"
        :content="readme"
        :downloads="downloads"
        :onOpenChange="change('document')"
        :onCopy="host.decide('copy')"
        :onDownload="host.decide('download')"
      />
    </section>
    <section data-case="generated-image">
      <GeneratedImage
        id="image"
        alt="A lighthouse at dusk"
        :src="lighthouse"
        v-bind="size"
        :onOpenChange="change('image')"
        :onDownload="host.decide('download')"
      />
    </section>
    <section data-case="file-tree">
      <FileTree
        id="file-tree"
        :entries="entries"
        :default-expanded="['src']"
        :onValueChange="change('file-tree')"
        :onExpandedChange="change('file-tree')"
        :onSelect="host.decide('select')"
      />
    </section>
    <section data-case="terminal">
      <Terminal
        id="terminal"
        command="npm install"
        :output="installRun"
        :exit-code="0"
        :duration-seconds="3"
        :onOpenChange="change('terminal')"
        :onCopy="host.decide('copy')"
      />
    </section>
    <section data-case="stack-trace">
      <StackTrace
        id="stack-trace"
        :stack="typeErrorStack"
        :onOpenChange="change('stack-trace')"
        :onShowLibraryFramesChange="change('stack-trace')"
        :onCopy="host.decide('copy')"
        :onOpenFrame="host.decide('openFrame')"
      />
    </section>
    <section data-case="test-results">
      <TestResults
        id="test-results"
        :suites="suites"
        default-open
        :onOpenChange="change('test-results')"
        :onFilterChange="change('test-results')"
        :onExpandedChange="change('test-results')"
      />
    </section>
    <section data-case="transcript">
      <Transcript
        id="transcript"
        :segments="standup"
        :onQueryChange="change('transcript')"
        :onSeek="host.decide('seek')"
      />
    </section>
    <section data-case="selection">
      <Selection
        id="selection"
        :actions="selectionActions"
        :onAction="host.decide('run')"
        :onDismiss="host.decide('dismiss')"
      >
        <p id="selection-text">
          Rate limits reset every hour. Each response carries the remaining count in its headers.
        </p>
      </Selection>
    </section>
    <section data-case="action">
      <Action
        id="action"
        label="Explain"
        status="running"
        quote="Rate limits reset every hour."
        result="The limit resets on the hour."
        :onOpenChange="change('action')"
      />
    </section>
  </div>
</template>
