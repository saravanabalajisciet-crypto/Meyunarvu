"use client";

/**
 * NarrationBar — browser Web Speech API story reader.
 *
 * Uses window.speechSynthesis (no external TTS package).
 * Supports Play / Pause / Resume / Stop.
 * Detects available voices for en-IN, en-US, and ta-IN.
 * If no Tamil voice is detected, Tamil option is hidden with a clear message.
 *
 * Text extraction: strips HTML tags from the rendered story HTML string
 * passed via the `storyHtml` prop — no DOM queries, SSR-safe.
 *
 * Long-text chunking: splits on sentence boundaries to work around the
 * ~32 KB per-utterance limit present in some browsers (notably Chrome on
 * Android). Chunks are queued and played in order.
 *
 * Cleanup: cancels speech on component unmount so audio stops when the
 * reader navigates away.
 */

import { useEffect, useRef, useState, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────────────── */

type PlayState = "idle" | "playing" | "paused" | "error";

type LangOption = {
  label: string;
  locale: string;
  voice: SpeechSynthesisVoice | null;
};

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Strip HTML tags and decode common entities → plain readable text. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?(h[1-6]|p|li|blockquote|tr|td|th|div|section|article)[^>]*>/gi, " \n")
    .replace(/<br\s*\/?>/gi, " \n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

/** Split long text into ≤ 4 000-char sentence chunks. */
function splitIntoChunks(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + s).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}

/** Find the best matching voice for a locale (exact → language prefix). */
function pickVoice(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | null {
  const exact = voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase());
  if (exact) return exact;
  const prefix = locale.split("-")[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
}

/* ── Component ─────────────────────────────────────────────────────────── */

interface NarrationBarProps {
  /** HTML string from markdownToHtml — narration reads plain-text version. */
  storyHtml: string;
  /** Optional title spoken before the body. */
  title?: string;
}

export default function NarrationBar({ storyHtml, title }: NarrationBarProps) {
  const [supported, setSupported] = useState<boolean | null>(null); // null = checking
  const [state, setState] = useState<PlayState>("idle");
  const [langs, setLangs] = useState<LangOption[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string>("en-IN");
  const [tamilUnavailable, setTamilUnavailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const chunksRef = useRef<string[]>([]);
  const chunkIdxRef = useRef(0);
  const isMountedRef = useRef(true);

  /* Check API support and load voices */
  useEffect(() => {
    isMountedRef.current = true;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    function buildLangOptions(voices: SpeechSynthesisVoice[]) {
      if (!isMountedRef.current) return;
      const enIN = pickVoice(voices, "en-IN");
      const enUS = pickVoice(voices, "en-US");
      const taIN = pickVoice(voices, "ta-IN");

      const options: LangOption[] = [];
      const englishVoice = enIN ?? enUS;
      if (englishVoice) {
        options.push({ label: "English", locale: englishVoice.lang, voice: englishVoice });
      }
      if (taIN) {
        options.push({ label: "Tamil", locale: "ta-IN", voice: taIN });
        setTamilUnavailable(false);
      } else {
        setTamilUnavailable(true);
      }

      setLangs(options);
      if (options.length > 0) setSelectedLocale(options[0].locale);
    }

    // Voices may be available immediately or load asynchronously
    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) {
      buildLangOptions(initial);
    }
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      buildLangOptions(window.speechSynthesis.getVoices());
    });

    return () => {
      isMountedRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  /* Cancel speech on unmount */
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ── Chunked playback ─────────────────────────────────────────────────── */

  const speakChunk = useCallback(
    (idx: number, voice: SpeechSynthesisVoice | null, locale: string) => {
      if (idx >= chunksRef.current.length) {
        if (isMountedRef.current) setState("idle");
        return;
      }
      const utter = new SpeechSynthesisUtterance(chunksRef.current[idx]);
      utter.lang = locale;
      if (voice) utter.voice = voice;
      utter.rate = 0.95;
      utter.pitch = 1;

      utter.onend = () => {
        if (!isMountedRef.current) return;
        chunkIdxRef.current = idx + 1;
        speakChunk(idx + 1, voice, locale);
      };

      utter.onerror = (e) => {
        // "interrupted" fires when we call cancel() ourselves — not a real error
        if (e.error === "interrupted" || e.error === "canceled") return;
        if (isMountedRef.current) {
          setState("error");
          setErrorMsg(`Speech error: ${e.error}`);
        }
      };

      window.speechSynthesis.speak(utter);
    },
    []
  );

  /* ── Controls ─────────────────────────────────────────────────────────── */

  function handlePlay() {
    if (!supported || langs.length === 0) return;
    const selected = langs.find((l) => l.locale === selectedLocale) ?? langs[0];

    // Build plain text
    const plain = [
      title ? title + ". " : "",
      htmlToText(storyHtml),
    ].join("");

    if (!plain.trim()) {
      setErrorMsg("No readable content found.");
      setState("error");
      return;
    }

    window.speechSynthesis.cancel();
    chunksRef.current = splitIntoChunks(plain);
    chunkIdxRef.current = 0;
    setErrorMsg("");
    setState("playing");
    speakChunk(0, selected.voice, selected.locale);
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setState("paused");
  }

  function handleResume() {
    window.speechSynthesis.resume();
    setState("playing");
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    chunkIdxRef.current = 0;
    setState("idle");
    setErrorMsg("");
  }

  function handleLangChange(locale: string) {
    handleStop();
    setSelectedLocale(locale);
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  // Still checking for API support
  if (supported === null) return null;

  // API not supported at all
  if (supported === false) return null;

  // API supported but no voices loaded yet and no options
  if (langs.length === 0 && !tamilUnavailable) return null;

  return (
    <>
      {/* ── Mobile sticky player (visible when open on mobile) ──────────── */}
      <div
        className="narration-bar-sticky"
        role="region"
        aria-label="Story narration player"
        data-open={isOpen ? "true" : "false"}
      >
        {/* Top row: toggle + controls */}
        <div className="narration-bar-inner">
          {/* Headphone icon + label */}
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="narration-toggle touch-target"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close narration player" : "Open narration player"}
          >
            <svg
              className="narration-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            <span className="narration-toggle-label">
              {state === "playing" ? "Listening…" : state === "paused" ? "Paused" : "Listen"}
            </span>
          </button>

          {/* Controls — always visible on desktop, collapsible on mobile */}
          <div className="narration-controls" aria-hidden={!isOpen && true}>
            {/* Language selector */}
            {langs.length > 1 && (
              <select
                value={selectedLocale}
                onChange={(e) => handleLangChange(e.target.value)}
                disabled={state === "playing" || state === "paused"}
                className="narration-lang-select"
                aria-label="Narration language"
              >
                {langs.map((l) => (
                  <option key={l.locale} value={l.locale}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}

            {/* Play/Pause/Resume/Stop */}
            {state === "idle" || state === "error" ? (
              <button
                type="button"
                onClick={handlePlay}
                disabled={langs.length === 0}
                className="narration-btn narration-btn-primary touch-target"
                aria-label="Play narration"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="narration-icon" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play</span>
              </button>
            ) : state === "playing" ? (
              <>
                <button
                  type="button"
                  onClick={handlePause}
                  className="narration-btn touch-target"
                  aria-label="Pause narration"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="narration-icon" aria-hidden>
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  className="narration-btn touch-target"
                  aria-label="Stop narration"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="narration-icon" aria-hidden>
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  <span>Stop</span>
                </button>
              </>
            ) : (
              /* paused */
              <>
                <button
                  type="button"
                  onClick={handleResume}
                  className="narration-btn narration-btn-primary touch-target"
                  aria-label="Resume narration"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="narration-icon" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  className="narration-btn touch-target"
                  aria-label="Stop narration"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="narration-icon" aria-hidden>
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tamil unavailable notice */}
        {tamilUnavailable && (
          <p className="narration-warning">
            Tamil narration is not available on this device. Please install a Tamil TTS voice in your device settings to enable it.
          </p>
        )}

        {/* Error */}
        {state === "error" && errorMsg && (
          <p className="narration-error" role="alert">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Bottom-padding spacer so sticky bar does not cover content on mobile */}
      <div className="narration-spacer" aria-hidden />
    </>
  );
}
