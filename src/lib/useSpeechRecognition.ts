"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceAudioResult {
  audioBase64?: string;
  mimeType?: string;
  transcript?: string;
}

export interface UseVoiceOptions {
  onAudioReady?: (result: VoiceAudioResult) => void;
  onInterimResult?: (text: string) => void;
  onError?: (error: string) => void;
  autoStopSilenceMs?: number;
}

export function useVoiceRecognition(options: UseVoiceOptions = {}) {
  const {
    onAudioReady,
    onInterimResult,
    onError,
    autoStopSilenceMs = 2500,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const hasVoiceActivityRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMedia = Boolean(
        navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function",
      );
      setIsSupported(hasMedia);
    }
  }, []);

  const cleanupAudioContext = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();

    // Stop SpeechRecognition if active
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    // Stop MediaRecorder (triggers onstop event)
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    // Stop microphone media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    cleanupAudioContext();
    setIsListening(false);
  }, [cleanupAudioContext, clearSilenceTimer]);

  const startListening = useCallback(
    async (customOnAudioReady?: (result: VoiceAudioResult) => void) => {
      setError(null);
      setTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
      audioChunksRef.current = [];
      hasVoiceActivityRef.current = false;

      if (typeof window === "undefined" || !navigator.mediaDevices) {
        const msg = "Audio recording is not supported in this browser.";
        setError(msg);
        onError?.(msg);
        return;
      }

      try {
        // Request microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        // Set up real-time audio volume analyser for visualizer
        try {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

              if (avg > 15) {
                hasVoiceActivityRef.current = true;
                clearSilenceTimer();
                if (autoStopSilenceMs > 0) {
                  silenceTimerRef.current = setTimeout(() => {
                    if (hasVoiceActivityRef.current) {
                      stopListening();
                    }
                  }, autoStopSilenceMs);
                }
              }

              animFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
          }
        } catch {
          // Audio analyzer is optional
        }

        // Determine supported audio MIME type
        let mimeType = "audio/webm";
        if (typeof MediaRecorder !== "undefined") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
            mimeType = "audio/ogg";
          }
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const capturedTranscript = finalTranscriptRef.current.trim();

          if (audioBlob.size > 0) {
            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
              const base64Data = (reader.result as string)?.split(",")[1];
              const result: VoiceAudioResult = {
                audioBase64: base64Data,
                mimeType,
                transcript: capturedTranscript,
              };

              if (customOnAudioReady) {
                customOnAudioReady(result);
              } else {
                onAudioReady?.(result);
              }
            };
          } else if (capturedTranscript) {
            const result: VoiceAudioResult = { transcript: capturedTranscript };
            if (customOnAudioReady) {
              customOnAudioReady(result);
            } else {
              onAudioReady?.(result);
            }
          }
        };

        mediaRecorder.start(250);
        setIsListening(true);
        setError(null);

        // Optional parallel Web Speech API for live transcription preview (if available & online)
        const SpeechClass =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        if (SpeechClass) {
          try {
            const recognition = new SpeechClass();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
              let currentInterim = "";
              let currentFinal = finalTranscriptRef.current;
              for (let i = event.resultIndex; i < event.results.length; i++) {
                const item = event.results[i];
                const text = item[0]?.transcript || "";
                if (item.isFinal) {
                  currentFinal = currentFinal ? `${currentFinal} ${text}` : text;
                  finalTranscriptRef.current = currentFinal;
                } else {
                  currentInterim = currentInterim ? `${currentInterim} ${text}` : text;
                }
              }
              setTranscript(currentFinal);
              setInterimTranscript(currentInterim);
              onInterimResult?.(currentInterim || currentFinal);
            };

            // Suppress network errors from SpeechRecognition because MediaRecorder handles the audio
            recognition.onerror = (e: any) => {
              if (e.error !== "network" && e.error !== "no-speech") {
                // Ignore silent STT background errors
              }
            };

            recognition.onend = () => {
              // Ignore onend
            };

            speechRecognitionRef.current = recognition;
            recognition.start();
          } catch {
            // SpeechRecognition is purely optional preview
          }
        }
      } catch (err: any) {
        let msg = "Microphone access denied or audio recording failed.";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Microphone permission denied. Please allow microphone access in your browser settings.";
        }
        setError(msg);
        onError?.(msg);
        setIsListening(false);
      }
    },
    [autoStopSilenceMs, clearSilenceTimer, onAudioReady, onError, onInterimResult, stopListening],
  );

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript: () => {
      setTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
    },
  };
}

export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore TTS errors
  }
}
