import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, RotateCcw, X, Sparkles, Volume2 } from "lucide-react";
import { api } from "../services/api";
import { DiaryEntry } from "../types";

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntryCreated: (entry: DiaryEntry) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onEntryCreated
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(timerRef.current);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setErrorMsg(null);
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Web Audio API Analyser for live waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start drawing waveform
      drawWaveform();
    } catch (err: any) {
      console.warn("Microphone access denied or unavailable, providing fallback simulation:", err);
      setErrorMsg("Microphone permission unavailable. You can use the instant Demo Voice simulation!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Gradient green-amber bars matching the journal theme
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, "#22c55e");
        gradient.addColorStop(1, "#84cc16");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight || 3);

        x += barWidth + 1;
      }
    };

    renderFrame();
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    try {
      const entry = await api.submitVoice(audioBlob, "voice_memory.webm");
      onEntryCreated(entry);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit recording");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulatedDemoAudio = async () => {
    setIsUploading(true);
    try {
      // Create a dummy audio blob for demonstration
      const dummyBlob = new Blob([new Uint8Array(1024)], { type: "audio/webm" });
      const entry = await api.submitVoice(dummyBlob, "sih_ravi_demo.webm");
      onEntryCreated(entry);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Demo submission failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#fbf7ee] border-2 border-[#cbb79a] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a6e50] hover:text-[#3d2714] p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#e8dac1] text-[#4d3319] flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[#3d2817] font-serif-title">
            Record Daily Memory
          </h3>
          <p className="text-xs text-[#7d654c]">
            Speak naturally. LifeBook will transcribe, extract entities, and craft your diary draft.
          </p>
        </div>

        {/* Live Audio Waveform Canvas */}
        <div className="bg-[#f2e7d3] border border-[#d8c5aa] rounded-xl p-4 mb-5 flex flex-col items-center justify-center min-h-[120px]">
          <canvas
            ref={canvasRef}
            width={280}
            height={60}
            className="w-full max-w-[280px] h-[60px]"
          />

          <div className="mt-2 text-sm font-mono font-bold text-[#5c3e21]">
            {formatTime(recordingTime)}
          </div>

          {isRecording && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold animate-pulse mt-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Recording live audio...</span>
            </div>
          )}
        </div>

        {audioUrl && !isRecording && (
          <div className="mb-4 bg-[#eadecb] p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#543b23]">
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Recording Preview Ready</span>
            </div>
            <audio src={audioUrl} controls className="h-8 max-w-[180px]" />
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            {errorMsg}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-all active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Start Recording</span>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95 animate-bounce"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Recording</span>
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={startRecording}
                className="p-2.5 rounded-full bg-[#ebdcc4] hover:bg-[#decbb0] text-[#543b23] transition-colors"
                title="Re-record"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4a321d] hover:bg-[#342211] text-amber-100 font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isUploading ? "Uploading..." : "Understand with AI"}</span>
              </button>
            </>
          )}
        </div>

        {/* Hackathon Fast-Track Button */}
        <div className="mt-5 pt-4 border-t border-[#e5d5be] text-center">
          <button
            onClick={handleSimulatedDemoAudio}
            disabled={isUploading}
            className="text-xs text-[#8c6f52] hover:text-[#4d3319] underline font-medium"
          >
            ??? Or run the SIH / Ravi Live Demo recording instantly ?
          </button>
        </div>
      </div>
    </div>
  );
};
