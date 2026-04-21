import { Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VoiceMessageRecorderProps = {
  disabled?: boolean;
  onRecorded: (payload: {
    dataUrl: string;
    mimeType: string;
    fileName: string;
  }) => void;
};

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de lire le vocal"));
    reader.readAsDataURL(blob);
  });
}

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function VoiceMessageRecorder({
  disabled,
  onRecorded,
}: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const discardOnStopRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      clearTimer();
      return;
    }

    recorder.stop();
  };

  const cancelRecording = () => {
    discardOnStopRef.current = true;
    stopRecording();
  };

  const startRecording = async () => {
    if (disabled || isRecording) return;

    setError(null);

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Enregistrement audio non supporté sur ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];

      const supportedMimeType = preferredMimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearTimer();
        setIsRecording(false);

        if (discardOnStopRef.current) {
          discardOnStopRef.current = false;
          chunksRef.current = [];
          stopTracks();
          return;
        }

        try {
          const mimeType =
            recorder.mimeType || supportedMimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });

          if (blob.size === 0) {
            stopTracks();
            return;
          }

          const dataUrl = await blobToDataUrl(blob);
          const extension = mimeType.includes("mp4") ? "m4a" : "webm";
          const fileName = `vocal-${Date.now()}.${extension}`;

          onRecorded({
            dataUrl,
            mimeType,
            fileName,
          });
        } catch {
          setError("Impossible de préparer le message vocal.");
        } finally {
          stopTracks();
        }
      };

      recorder.onerror = () => {
        setError("Erreur lors de l'enregistrement audio.");
        setIsRecording(false);
        discardOnStopRef.current = false;
        clearTimer();
        stopTracks();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);

      startedAtRef.current = Date.now();
      setElapsedSeconds(0);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        const diff = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsedSeconds(diff);
      }, 300);
    } catch {
      setError("Accès au micro refusé ou indisponible.");
      setIsRecording(false);
      clearTimer();
      stopTracks();
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-100"
            title="Arrêter l'enregistrement"
          >
            <Square size={14} />
            Stop {formatElapsed(elapsedSeconds)}
          </button>
          <button
            type="button"
            onClick={cancelRecording}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-gray-600 transition hover:bg-gray-50"
            title="Annuler le vocal"
          >
            <Trash2 size={14} />
            Annuler
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#436D75] transition hover:bg-[#F7F3E9] disabled:cursor-not-allowed disabled:opacity-50"
          title="Enregistrer un message vocal"
        >
          <Mic size={14} />
          Vocal
        </button>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
