/**
 * What a dictation source reports: the microphone's level (0 to 1, for a waveform), recognized text, or why it
 * stopped. Final texts follow each other; an interim text replaces the interim text before it. `"denied"`: the person or the browser refused the microphone; `"unsupported"`: the
 * browser has no speech recognition.
 */
export type DictationEvent =
  | { level: number }
  | { text: string; final: boolean }
  | { error: "unsupported" | "denied" | "no-speech" | "network" | (string & {}) };

/**
 * Turns speech into text. `start` listens until `signal` aborts, then reports the text still to come and ends. A
 * signal aborted with the reason `"cancel"` means nothing more is read, so the source can drop what it heard.
 * Dictation never has a source of its own: the host passes one, so it decides where audio goes.
 */
export interface DictationSource {
  start(signal: AbortSignal): AsyncIterable<DictationEvent>;
}

export type SpeechDictationOptions = {
  /** The language spoken, like `"en-US"`. Defaults to the page's `lang`. */
  lang?: string;
};

// The parts of the Web Speech API this module uses; TypeScript's DOM library leaves it out.
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechRecognitionClass = new () => SpeechRecognitionLike;

const ERRORS: Record<string, string | undefined> = {
  "not-allowed": "denied",
  "service-not-allowed": "denied",
  // Reported when this module aborts recognition, which is never a failure.
  aborted: undefined,
};

/** A queue the browser's callbacks push into and the source's iterator reads from. */
const channel = () => {
  const queue: DictationEvent[] = [];
  let ended = false;
  let wake = () => {};
  return {
    push(event: DictationEvent) {
      if (ended) return;
      const last = queue.at(-1);
      // Only the newest level matters to a reader that fell behind.
      if (last && "level" in last && "level" in event) queue[queue.length - 1] = event;
      else queue.push(event);
      wake();
    },
    end() {
      ended = true;
      wake();
    },
    async *read(): AsyncGenerator<DictationEvent> {
      for (;;) {
        const next = queue.shift();
        if (next) yield next;
        else if (ended) return;
        else await new Promise<void>((resolve) => (wake = resolve));
      }
    },
  };
};

/** Reports the stream's loudness each frame, as the RMS of its samples, until the returned function is called. */
const meter = (stream: MediaStream, report: (level: number) => void) => {
  const audio = new AudioContext();
  const analyser = audio.createAnalyser();
  audio.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const read = () => {
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
    report(Math.min(1, Math.sqrt(sum / samples.length)));
    frame = requestAnimationFrame(read);
  };
  let frame = requestAnimationFrame(read);
  return () => {
    cancelAnimationFrame(frame);
    void audio.close();
  };
};

async function* listen(signal: AbortSignal, lang: string | undefined): AsyncGenerator<DictationEvent> {
  const scope = globalThis as {
    SpeechRecognition?: SpeechRecognitionClass;
    webkitSpeechRecognition?: SpeechRecognitionClass;
  };
  const Recognition = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  const media = globalThis.navigator?.mediaDevices;
  if (!Recognition || !media) {
    yield { error: "unsupported" };
    return;
  }
  if (signal.aborted) return;
  let stream: MediaStream;
  try {
    stream = await media.getUserMedia({ audio: true });
  } catch (error) {
    yield { error: (error as DOMException).name === "NotAllowedError" ? "denied" : "audio-capture" };
    return;
  }

  const events = channel();
  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  if (lang) recognition.lang = lang;
  // Finals in order, then every result still changing as one interim text.
  recognition.onresult = ({ resultIndex, results }) => {
    let interim = "";
    for (let i = resultIndex; i < results.length; i++) {
      const result = results[i] as SpeechResult;
      if (result.isFinal) events.push({ text: result[0].transcript, final: true });
      else interim += result[0].transcript;
    }
    if (interim) events.push({ text: interim, final: false });
  };
  recognition.onerror = ({ error }) => {
    const reported = error in ERRORS ? ERRORS[error] : error;
    if (reported) events.push({ error: reported });
  };
  recognition.onend = () => events.end();

  let released = false;
  let stopMeter = () => {};
  const release = () => {
    if (released) return;
    released = true;
    stopMeter();
    for (const track of stream.getTracks()) track.stop();
  };
  // `stop`, not `abort`: recognition still reports the final text of what was said before it ends, unless canceled.
  const stop = () => {
    release();
    if (signal.reason === "cancel") recognition.abort();
    else recognition.stop();
  };
  signal.addEventListener("abort", stop, { once: true });
  try {
    if (signal.aborted) return;
    stopMeter = meter(stream, (level) => events.push({ level }));
    recognition.start();
    yield* events.read();
  } finally {
    signal.removeEventListener("abort", stop);
    release();
    recognition.abort();
  }
}

/**
 * A dictation source over the browser's speech recognition (`SpeechRecognition`, prefixed in WebKit), with levels
 * from the microphone through Web Audio. Chrome's recognition sends audio to a speech service. Without speech
 * recognition it reports `{ error: "unsupported" }`.
 */
export const createSpeechDictation = ({ lang }: SpeechDictationOptions = {}): DictationSource => ({
  start: (signal) => listen(signal, lang),
});
