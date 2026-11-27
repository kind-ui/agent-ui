export {
  type ActionOptions,
  type ActionPrimitive,
  type ActionState,
  actionPrimitive,
} from "./action/index.js";
export {
  type AddMenuActionReason,
  type AddMenuApi,
  type AddMenuContentState,
  type AddMenuOptions,
  type AddMenuPrimitive,
  type AddMenuRow,
  type AddMenuSection,
  type AddMenuState,
  addMenuPrimitive,
  addMenuSections,
} from "./add-menu/index.js";
export { type AnsiLine, type AnsiLines, type AnsiSpan, createAnsiLines } from "./ansi.js";
export {
  type AlwaysScope,
  approvalKey,
  approvalLabel,
  approvalMark,
  isActionable,
  isSettled,
} from "./approval.js";
export {
  APPROVAL_MODE_GROUP,
  APPROVAL_MODE_LEARN_MORE,
  type ApprovalModeApi,
  type ApprovalModeChangeReason,
  type ApprovalModeContentState,
  type ApprovalModeOptions,
  type ApprovalModePrimitive,
  type ApprovalModeRow,
  type ApprovalModeState,
  type ApprovalModeTriggerState,
  approvalModeName,
  approvalModePrimitive,
  approvalModeRows,
} from "./approval-mode/index.js";
export {
  type ApprovalPartConfig,
  type ApprovalPartOptions,
  type ApprovalPartState,
  type ApprovalState,
  approvalPart,
} from "./approval-part.js";
export {
  ATTACHMENT_ERRORS,
  type AttachmentItem,
  type AttachmentState,
  type AttachmentsApi,
  type AttachmentsOptions,
  type AttachmentsPrimitive,
  type AttachmentsRootState,
  type AttachmentsState,
  attachmentDetail,
  attachmentsPrimitive,
} from "./attachments/index.js";
export {
  type ChainOfThoughtApi,
  type ChainOfThoughtOptions,
  type ChainOfThoughtPrimitive,
  type ChainOfThoughtState,
  type ChainOfThoughtStep,
  chainOfThoughtPrimitive,
  type NextOpenStepsInput,
  nextOpenSteps,
  stepDuration,
} from "./chain-of-thought/index.js";
export {
  type CheckpointApi,
  type CheckpointChanges,
  type CheckpointDialogState,
  type CheckpointOptions,
  type CheckpointPrimitive,
  type CheckpointRestoreDetails,
  type CheckpointScope,
  type CheckpointScopeState,
  type CheckpointState,
  checkpointPrimitive,
} from "./checkpoint/index.js";
export {
  type CodeBlockApi,
  type CodeBlockOptions,
  type CodeBlockPrimitive,
  type CodeBlockState,
  type CodeBlockWrapChangeReason,
  codeBlockPrimitive,
  type Highlight,
  type Token,
} from "./code-block/index.js";
export { type ComposedHandler, hearComposed } from "./composed-events.js";
export {
  type ComposerApi,
  type ComposerAttachment,
  type ComposerAttachmentsState,
  type ComposerDraft,
  type ComposerInputState,
  type ComposerKeys,
  type ComposerOptions,
  type ComposerPrimitive,
  type ComposerRootState,
  type ComposerSendItem,
  type ComposerSendMenuState,
  type ComposerSendMenuTriggerState,
  type ComposerState,
  type ComposerSteerDetails,
  type ComposerSteerMode,
  type ComposerSteerState,
  type ComposerToken,
  type ComposerTriggerItem,
  type ComposerTriggerMenuState,
  type ComposerValueChangeReason,
  composerPrimitive,
  draftAfterSettle,
  isSubmittable,
} from "./composer/index.js";
export {
  type ConfirmationApi,
  type ConfirmationCallback,
  type ConfirmationChoice,
  type ConfirmationDecision,
  type ConfirmationOptions,
  type ConfirmationPrimitive,
  type ConfirmationReasonState,
  type ConfirmationState,
  confirmationMeta,
  confirmationPrimitive,
} from "./confirmation/index.js";
export {
  CONTEXT_BAR_FIRST_ITEM,
  type ContextBarApi,
  type ContextBarChipState,
  type ContextBarListState,
  type ContextBarOptions,
  type ContextBarOverflowState,
  type ContextBarPresentation,
  type ContextBarPrimitive,
  type ContextBarRemoveReason,
  type ContextBarState,
  contextBarPrimitive,
  fitChips,
} from "./context-bar/index.js";
export {
  type ContextBreakdown,
  type ContextLevel,
  type ContextLimitRow,
  type ContextMeterApi,
  type ContextMeterBarState,
  type ContextMeterOpenChangeReason,
  type ContextMeterOptions,
  type ContextMeterPrimitive,
  type ContextMeterState,
  type ContextMeterValueState,
  type ContextRow,
  type ContextSlice,
  contextBreakdown,
  contextLimits,
  contextMeterPrimitive,
  contextRows,
  contextValueText,
  limitAmount,
} from "./context-meter/index.js";
export {
  type ConversationApi,
  type ConversationController,
  type ConversationOptions,
  type ConversationPrimitive,
  type ConversationRetryDetails,
  type ConversationState,
  type ConversationStatus,
  conversationPrimitive,
  createConversationController,
  type FollowEvent,
  type FollowState,
  nextFollowState,
} from "./conversation/index.js";
export {
  createSpeechDictation,
  type DictationEvent,
  type DictationSource,
  type SpeechDictationOptions,
} from "./dictation.js";
export {
  type DictationApi,
  type DictationOptions,
  type DictationPhase,
  type DictationPrimitive,
  type DictationState,
  type DictationStatusState,
  type DictationTextReason,
  type DictationWaveformState,
  dictationButtonPrimitive,
} from "./dictation-button/index.js";
export {
  type DocumentApi,
  type DocumentContentState,
  type DocumentDownload,
  type DocumentFormat,
  type DocumentOpenChangeReason,
  type DocumentOptions,
  type DocumentPrimitive,
  type DocumentState,
  documentPrimitive,
  documentSize,
} from "./document/index.js";
export {
  type FeedbackApi,
  type FeedbackCommentCallback,
  type FeedbackCommentTextState,
  type FeedbackOptions,
  type FeedbackPrimitive,
  type FeedbackRating,
  type FeedbackRatingChangeReason,
  type FeedbackState,
  type FeedbackThumbsState,
  feedbackPrimitive,
} from "./feedback/index.js";
export {
  type FileTreeApi,
  type FileTreeChange,
  type FileTreeExpandedChangeReason,
  type FileTreeOptions,
  type FileTreePrimitive,
  type FileTreeRow,
  type FileTreeSelectReason,
  type FileTreeState,
  type FileTreeTreeState,
  type FileTreeValueChangeReason,
  fileTreePrimitive,
} from "./file-tree/index.js";
export {
  type GeneratedImageApi,
  type GeneratedImageDownloadDetails,
  type GeneratedImageOptions,
  type GeneratedImagePhase,
  type GeneratedImagePrimitive,
  type GeneratedImageProgressState,
  type GeneratedImageState,
  type GeneratedImageStatus,
  generatedImagePrimitive,
} from "./generated-image/index.js";
export {
  type GuardrailNoticeApi,
  type GuardrailNoticeOpenChangeReason,
  type GuardrailNoticeOptions,
  type GuardrailNoticePrimitive,
  type GuardrailNoticeState,
  guardrailNoticePrimitive,
} from "./guardrail-notice/index.js";
export {
  type IndicatorOptions,
  type IndicatorPrimitive,
  type IndicatorState,
  indicatorLabel,
} from "./indicator.js";
export {
  type InlineCitationApi,
  type InlineCitationCarouselState,
  type InlineCitationOpenChangeReason,
  type InlineCitationOptions,
  type InlineCitationPrimitive,
  type InlineCitationRootState,
  type InlineCitationState,
  inlineCitationPrimitive,
} from "./inline-citation/index.js";
export {
  type ItemListApi,
  type ItemListOptions,
  type ItemListState,
  type ItemProgress,
  itemProgress,
  itemsStatus,
} from "./item-list.js";
export { dropRow, type LeavingRow, mergeLeaving } from "./leaving.js";
export { createListFocus, type ListFocus } from "./list-focus.js";
export { loaderPrimitive } from "./loader/index.js";
export {
  createMarkdownEngine,
  type MarkdownBlock,
  type MarkdownEngine,
  type MdNode,
} from "./markdown/index.js";
export {
  type MarkdownTableApi,
  type MarkdownTablePrimitive,
  type MarkdownTableState,
  markdownTablePrimitive,
} from "./markdown-table/index.js";
export {
  type MarkdownOptions,
  type MarkdownState,
  type MarkdownViewPrimitive,
  markdownViewPrimitive,
} from "./markdown-view/index.js";
export {
  type MenuBaseApi,
  type MenuBaseConfig,
  type MenuBaseOptions,
  type MenuBaseSlots,
  type MenuBaseState,
  type MenuChoice,
  type MenuPartState,
  type MenuPresentation,
  type MenuRun,
  type MenuTriggerState,
  menuBase,
  menuItems,
} from "./menu-base.js";
export {
  branchLabel,
  MESSAGE_TRY_AGAIN,
  type MessageApi,
  type MessageAvatarState,
  type MessageBranchChangeReason,
  type MessageDelivery,
  type MessageDeliveryDetails,
  type MessageOptions,
  type MessageOutcome,
  type MessageOutcomeDetails,
  type MessagePrimitive,
  type MessageRegenerateContentState,
  type MessageRegenerateDetails,
  type MessageRegenerateReason,
  type MessageRegenerateState,
  type MessageState,
  type MessageTimeState,
  messageDeliveryText,
  messageOutcomeText,
  messagePrimitive,
  messageRetryText,
} from "./message/index.js";
export {
  MODEL_CONTROL_EFFORT,
  MODEL_CONTROL_MODEL,
  type ModelControlApi,
  type ModelControlChangeReason,
  type ModelControlEffortChangeReason,
  type ModelControlOptions,
  type ModelControlPrimitive,
  type ModelControlState,
  type ModelControlTriggerState,
  modelControlPrimitive,
  modelEffort,
} from "./model-control/index.js";
export {
  type ModelSelectorApi,
  type ModelSelectorOptions,
  type ModelSelectorPrimitive,
  type ModelSelectorState,
  type ModelSelectorValueChangeReason,
  modelSelectorPrimitive,
} from "./model-selector/index.js";
export {
  enter,
  exit,
  layout,
  type MotionMode,
  type MotionOptions,
  type MotionPreset,
  type ResolvedMotion,
  reducedKeyframes,
  resolveMotion,
} from "./motion/index.js";
export {
  type NoticeApi,
  type NoticeOptions,
  type NoticePrimitive,
  type NoticeState,
  type NoticeVariant,
  noticePrimitive,
} from "./notice/index.js";
export { createPendingAction, type PendingAction, type PendingActionOptions } from "./pending.js";
export {
  type PickerApi,
  type PickerBaseApi,
  type PickerBaseConfig,
  type PickerBaseOptions,
  type PickerBaseSlots,
  type PickerBaseState,
  type PickerCommandState,
  type PickerItemState,
  type PickerOpenChangeReason,
  type PickerOption,
  type PickerOptions,
  type PickerPage,
  type PickerPresentation,
  type PickerPrimitive,
  type PickerRow,
  type PickerRowKind,
  type PickerSearchOptions,
  type PickerSection,
  type PickerSelectOptions,
  type PickerState,
  type PickerTriggerState,
  type PickerValueChangeReason,
  pickerBase,
  pickerPages,
  pickerPrimitive,
} from "./picker/index.js";
export {
  type PlanApi,
  type PlanOptions,
  type PlanPrimitive,
  type PlanState,
  planPrimitive,
} from "./plan/index.js";
export {
  answerText,
  applyAnswer,
  missingAnswers,
  type QuestionApi,
  type QuestionCallback,
  type QuestionChoicesState,
  type QuestionOptions,
  type QuestionPrimitive,
  type QuestionState,
  type QuestionSummaryItem,
  type QuestionTextState,
  type QuestionValueChangeReason,
  questionPrimitive,
} from "./question/index.js";
export {
  type QueueApi,
  type QueueItemActionDetails,
  type QueueOptions,
  type QueuePrimitive,
  type QueueReorderReason,
  type QueueSection,
  type QueueSectionState,
  type QueueState,
  queueInstructions,
  queueItemName,
  queuePrimitive,
  queueRows,
  queueSection,
} from "./queue/index.js";
export {
  type ReasoningOptions,
  type ReasoningPrimitive,
  type ReasoningState,
  reasoningPrimitive,
  reasoningTitle,
} from "./reasoning/index.js";
export {
  type ReasoningEffortApi,
  type ReasoningEffortControlState,
  type ReasoningEffortLevel,
  type ReasoningEffortOptions,
  type ReasoningEffortPrimitive,
  type ReasoningEffortState,
  type ReasoningEffortValueChangeReason,
  reasoningEffortPrimitive,
} from "./reasoning-effort/index.js";
export {
  type SelectionActionReason,
  type SelectionActionRun,
  type SelectionApi,
  type SelectionDismissReason,
  type SelectionItemState,
  type SelectionOptions,
  type SelectionPrimitive,
  type SelectionState,
  type SelectionToolbarState,
  selectionPrimitive,
} from "./selection/index.js";
export {
  type SettingsBaseApi,
  type SettingsBaseConfig,
  type SettingsBaseOptions,
  type SettingsBaseSlots,
  type SettingsBaseState,
  type SettingsCause,
  type SettingsMenuAction,
  type SettingsMenuApi,
  type SettingsMenuChangeDetails,
  type SettingsMenuChangeReason,
  type SettingsMenuChoiceRow,
  type SettingsMenuContentState,
  type SettingsMenuOptionGroup,
  type SettingsMenuOptions,
  type SettingsMenuPrimitive,
  type SettingsMenuRow,
  type SettingsMenuState,
  type SettingsMenuToggleRow,
  settingsBase,
  settingsChoiceRow,
  settingsData,
  settingsMenuPrimitive,
  settingsMenuRows,
} from "./settings-menu/index.js";
export {
  type SourceEntry,
  type SourcesApi,
  type SourcesOpenChangeReason,
  type SourcesOptions,
  type SourcesPrimitive,
  type SourcesState,
  sourcesPrimitive,
} from "./sources/index.js";
export { isLibraryFrame, parseStack } from "./stack.js";
export {
  type StackTraceApi,
  type StackTraceCopyReason,
  type StackTraceFrameEntry,
  type StackTraceItemPartProps,
  type StackTraceLibraryChangeReason,
  type StackTraceOpenFrameReason,
  type StackTraceOptions,
  type StackTracePrimitive,
  type StackTraceRow,
  type StackTraceState,
  stackTracePrimitive,
} from "./stack-trace/index.js";
export {
  type StatusOptions,
  type StatusPrimitive,
  type StatusState,
  statusPrimitive,
} from "./status/index.js";
export {
  bindStepPanel,
  type NextOpenInput,
  nextOpen,
  type StepApi,
  type StepAutoOpen,
  type StepBaseConfig,
  type StepListApi,
  type StepListOptions,
  type StepListPrimitive,
  type StepListState,
  type StepOpenChangeReason,
  type StepOptions,
  type StepPanelOptions,
  type StepPrimitive,
  type StepState,
  stepAnnouncement,
  stepBase,
  stepListPrimitive,
  stepPrimitive,
} from "./step/index.js";
export {
  type StreamingTextApi,
  type StreamingTextChunk,
  type StreamingTextDiff,
  type StreamingTextOptions,
  type StreamingTextPrimitive,
  type StreamingTextState,
  streamingTextDiff,
  streamingTextPrimitive,
} from "./streaming-text/index.js";
export {
  avatarInitials,
  type SubagentApi,
  type SubagentOptions,
  type SubagentPrimitive,
  type SubagentState,
  subagentPrimitive,
  subagentStatus,
} from "./subagent/index.js";
export {
  type SuggestionApi,
  type SuggestionItemState,
  type SuggestionLayout,
  type SuggestionOptions,
  type SuggestionPickReason,
  type SuggestionPrimitive,
  type SuggestionRootState,
  type SuggestionState,
  suggestionPrimitive,
} from "./suggestion/index.js";
export {
  type TaskApi,
  type TaskOptions,
  type TaskPrimitive,
  type TaskState,
  taskPrimitive,
} from "./task/index.js";
export {
  type TerminalApi,
  type TerminalApprovalState,
  type TerminalCopyReason,
  type TerminalOptions,
  type TerminalPrimitive,
  type TerminalState,
  terminalPrimitive,
} from "./terminal/index.js";
export {
  emptyTestsText,
  type TestCounts,
  type TestResultsApi,
  type TestResultsCountState,
  type TestResultsExpandedChangeReason,
  type TestResultsFailureState,
  type TestResultsFilter,
  type TestResultsFilterChangeReason,
  type TestResultsOptions,
  type TestResultsPrimitive,
  type TestResultsRow,
  type TestResultsState,
  type TestResultsTreeState,
  testCounts,
  testItems,
  testResultsPrimitive,
  testValue,
} from "./test-results/index.js";
export { thinkingIndicatorPrimitive } from "./thinking-indicator/index.js";
export {
  statusGroup,
  type ThreadGroup,
  type ThreadGroupOptions,
  type ThreadStatusGroupKey,
  threadGroups,
} from "./thread-groups.js";
export { type ThreadMark, threadMark } from "./thread-mark.js";
export {
  compactTimeLabel,
  type DateGroup,
  type DateGroupKey,
  type DateGroupOptions,
  dateGroup,
  dayKey,
  dayLabel,
  durationLabel,
  isContinuation,
  isSameDay,
  type RelativeTimeOptions,
  type TimeOptions,
  timeLabel,
  todayKey,
} from "./time.js";
export {
  humanizeToolName,
  type ToolApi,
  type ToolApprovalState,
  type ToolHeading,
  type ToolHeadingInput,
  type ToolOptions,
  type ToolPrimitive,
  type ToolState,
  toolCode,
  toolPrimitive,
  toolStatus,
  toolValue,
} from "./tool/index.js";
export { currentAt, searchSegments } from "./transcript/search.js";
export {
  type TranscriptApi,
  type TranscriptItemPartProps,
  type TranscriptOptions,
  type TranscriptPrimitive,
  type TranscriptQueryChangeReason,
  type TranscriptSearchState,
  type TranscriptSeekReason,
  type TranscriptState,
  transcriptPrimitive,
} from "./transcript/transcript.js";
export { pathItems, treeValues } from "./tree.js";
export { typingIndicatorPrimitive } from "./typing-indicator/index.js";
export {
  type UploaderApi,
  type UploaderFilesDetails,
  type UploaderListState,
  type UploaderOptions,
  type UploaderPrimitive,
  type UploaderRootState,
  type UploaderState,
  type UploadItem,
  type UploadItemState,
  type UploadStatus,
  uploadDetail,
  uploaderPrimitive,
} from "./uploader/index.js";

// Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its exports right below its own line.

// wave-6-task-2: Thread List

export {
  type ThreadListAction,
  type ThreadListApi,
  type ThreadListDialogState,
  type ThreadListEntry,
  type ThreadListGridState,
  type ThreadListLinkState,
  type ThreadListLoadReason,
  type ThreadListMenuContentState,
  type ThreadListOptions,
  type ThreadListPrimitive,
  type ThreadListReason,
  type ThreadListRow,
  type ThreadListRowsOptions,
  type ThreadListState,
  type ThreadListSummaryState,
  type ThreadListTimeState,
  threadListPrimitive,
  threadListRows,
} from "./thread-list/index.js";

// wave-6-task-3: Thread Search

export {
  type ThreadSearchApi,
  type ThreadSearchIcon,
  type ThreadSearchOptions,
  type ThreadSearchPrimitive,
  type ThreadSearchSelectReason,
  type ThreadSearchState,
  threadSearchPrimitive,
} from "./thread-search/index.js";

// wave-6-task-4: Sidebar

export {
  type SidebarApi,
  type SidebarHandleState,
  type SidebarInsetState,
  type SidebarOpenChangeReason,
  type SidebarOptions,
  type SidebarPanelState,
  type SidebarPrimitive,
  type SidebarRootState,
  type SidebarSide,
  type SidebarState,
  type SidebarTriggerState,
  sidebarPrimitive,
} from "./sidebar/index.js";

// wave-6-task-5: Launcher, dropped by the user

// wave-6-task-6: Day Separator

export {
  type DaySeparatorLabelState,
  type DaySeparatorOptions,
  type DaySeparatorPrimitive,
  type DaySeparatorState,
  daySeparatorPrimitive,
} from "./day-separator/index.js";

// wave-6-task-7: Connection Status

export {
  type ConnectionPhase,
  type ConnectionState,
  type ConnectionStatusApi,
  type ConnectionStatusLabels,
  type ConnectionStatusOptions,
  type ConnectionStatusPrimitive,
  type ConnectionStatusRetryDetails,
  type ConnectionStatusState,
  connectionStatusPrimitive,
  connectionStatusText,
} from "./connection-status/index.js";

// wave-6-task-8: Share Dialog

export {
  SHARE_DIALOG_DESCRIPTIONS,
  SHARE_VISIBILITY_OPTIONS,
  type ShareDialogActionDetails,
  type ShareDialogActionState,
  type ShareDialogApi,
  type ShareDialogLinkState,
  type ShareDialogOptions,
  type ShareDialogPresentation,
  type ShareDialogPrimitive,
  type ShareDialogState,
  type ShareDialogVisibilityState,
  type ShareVisibility,
  type ShareVisibilityChangeReason,
  type ShareVisibilityOption,
  shareDialogPrimitive,
} from "./share-dialog/index.js";

// wave-6-task-9: Message author, time and outcomes

// wave-6-task-10: Conversation states

// wave-6-task-11: Conversation Search

export { aggregateStatus } from "./aggregate.js";
export {
  type ConversationSearchApi,
  type ConversationSearchInputState,
  type ConversationSearchMatch,
  type ConversationSearchMessage,
  type ConversationSearchOpenChangeReason,
  type ConversationSearchOptions,
  type ConversationSearchPrimitive,
  type ConversationSearchQueryChangeReason,
  type ConversationSearchState,
  conversationSearchPrimitive,
  findMatches,
  searchText,
} from "./conversation-search/index.js";
export { costName } from "./cost.js";
export { type Countdown, type CountdownOptions, countdownText, createCountdown } from "./countdown.js";
export {
  type DiffAction,
  type DiffActionDetails,
  type DiffApi,
  type DiffChangeView,
  type DiffFileView,
  type DiffLineView,
  type DiffOpenReason,
  type DiffOptions,
  type DiffPiece,
  type DiffPrimitive,
  type DiffRow,
  type DiffRows,
  type DiffState,
  type DiffSummaryView,
  type DiffTableRow,
  type DiffTarget,
  type DiffWord,
  diffCounts,
  diffCountsName,
  diffPrimitive,
  diffRows,
} from "./diff/index.js";
export { leftText, type ResetOptions, type ResetStyle, resetWhen } from "./reset.js";
export { failedAfterText, retryAnnouncement, retryReason, retryText } from "./retry.js";
export {
  NOT_STALLED,
  type StalledOptions,
  type StalledState,
  stalledFor,
  stalledText,
  watchStalled,
} from "./stalled.js";
export {
  type StepGroupApi,
  type StepGroupKind,
  type StepGroupKinds,
  type StepGroupMetaInput,
  type StepGroupOptions,
  type StepGroupPrimitive,
  type StepGroupState,
  type StepGroupTitleInput,
  stepGroupFinished,
  stepGroupLive,
  stepGroupMeta,
  stepGroupPrimitive,
  stepGroupSentence,
  stepGroupTitle,
} from "./step-group/index.js";
export { codeSpans, plainText, WORDS } from "./words.js";
