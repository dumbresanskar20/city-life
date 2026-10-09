import React, { useState } from "react";
import {
  AlertTriangle,
  Lightbulb,
  Droplet,
  Trash2,
  Car,
  ShieldAlert,
  Flame,
  Camera,
  Mic,
  MicOff,
  CheckCircle2,
  Sparkles,
  MapPin,
} from "lucide-react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Stepper } from "../../components/Tabs";
import { VerificationBadge } from "../../components/VerificationBadge";
import { ScoreRing } from "../../components/ScoreRing";
import { api } from "../../lib/api";
import { useToastStore } from "../../store/toastStore";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLat?: number;
  defaultLng?: number;
  onReportCreated?: (report: any) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  defaultLat = 18.5204,
  defaultLng = 73.8567,
  onReportCreated,
}) => {
  const addToast = useToastStore((s) => s.addToast);
  const [step, setStep] = useState(0);

  // Form State
  const [category, setCategory] = useState("pothole");
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Verification Animation State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStage, setVerifyStage] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const categories = [
    { id: "pothole", label: "Pothole / Road Damage", icon: <AlertTriangle className="w-5 h-5 text-caution" /> },
    { id: "broken_light", label: "Broken Streetlight", icon: <Lightbulb className="w-5 h-5 text-info" /> },
    { id: "waterlogging", label: "Waterlogging / Flooding", icon: <Droplet className="w-5 h-5 text-info" /> },
    { id: "garbage", label: "Overflowing Garbage", icon: <Trash2 className="w-5 h-5 text-caution" /> },
    { id: "accident", label: "Accident / Road Hazard", icon: <Car className="w-5 h-5 text-danger" /> },
    { id: "harassment", label: "Safety / Harassment", icon: <ShieldAlert className="w-5 h-5 text-danger" /> },
    { id: "traffic", label: "Severe Traffic Jam", icon: <Flame className="w-5 h-5 text-secondary" /> },
  ];

  const verifyStages = [
    "Parsing report text & civic specifics...",
    "Corroborating spatial sensors & past 24h reports...",
    "Scanning visual features & metadata...",
    "Synthesizing Bayesian credibility score...",
  ];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        addToast({ type: "danger", title: "File Too Large", message: "Maximum photo size is 8MB." });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      addToast({
        type: "caution",
        title: "Voice Dictation",
        message: "Web Speech API is not supported in this browser. Please type description.",
      });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onstart = () => setIsRecording(true);
        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setVoiceTranscript(text);
          setDescription((prev) => (prev ? `${prev} ${text}` : text));
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } catch {
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = async () => {
    setIsVerifying(true);
    setVerifyStage(0);

    // Staged progression animation
    const stageTimer1 = setTimeout(() => setVerifyStage(1), 600);
    const stageTimer2 = setTimeout(() => setVerifyStage(2), 1200);
    const stageTimer3 = setTimeout(() => setVerifyStage(3), 1800);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("description", description);
      formData.append("lat", String(lat));
      formData.append("lng", String(lng));
      if (voiceTranscript) formData.append("transcript", voiceTranscript);
      if (photoFile) formData.append("photo", photoFile);

      const result = await api.submitReport(formData);

      setTimeout(() => {
        setIsVerifying(false);
        setVerificationResult(result);
        onReportCreated?.(result);
        addToast({
          type: "safe",
          title: "Report Verified",
          message: `Credibility Score: ${Math.round(result.credibility_score)}/100 (${result.verification_status})`,
        });
      }, 2400);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setIsVerifying(false);
      addToast({ type: "danger", title: "Submission Failed", message: err.message });
    }
  };

  const handleReset = () => {
    setStep(0);
    setDescription("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setVoiceTranscript(null as any);
    setVerificationResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Report Urban Civic Issue"
      subtitle="AI-verified community incident reporting with transparency"
    >
      {isVerifying ? (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-base font-bold text-text-1">AI Credibility Pipeline Active</h4>
            <p className="text-xs text-text-3 font-mono animate-pulse">{verifyStages[verifyStage]}</p>
          </div>
        </div>
      ) : verificationResult ? (
        <div className="py-6 space-y-6">
          <div className="p-5 rounded-card bg-bg-2/50 border border-glass-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">
                Assigned Verification Tier
              </span>
              <div className="pt-1">
                <VerificationBadge
                  status={verificationResult.verification_status}
                  credibilityScore={verificationResult.credibility_score}
                />
              </div>
            </div>
            <ScoreRing
              score={verificationResult.credibility_score}
              size={68}
              strokeWidth={6}
              label="Credibility"
            />
          </div>

          <div className="p-4 rounded-card bg-primary/10 border border-primary/30 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verification Factors</span>
            </h5>
            <ul className="text-xs text-text-2 space-y-1 list-disc pl-4">
              {verificationResult.reasons.map((r: string, idx: number) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-text-3 text-center">
            {verificationResult.verification_status === "ai_verified"
              ? "This verified report has been added to the city safety map and route risk model."
              : "This report has been published for nearby community corroboration."}
          </p>

          <Button variant="primary" size="md" className="w-full" onClick={handleReset}>
            View on Map
          </Button>
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          <Stepper
            currentStep={step}
            steps={[
              { label: "Category" },
              { label: "Location" },
              { label: "Details" },
              { label: "Media" },
              { label: "Submit" },
            ]}
          />

          {/* Step 1: Category */}
          {step === 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-text-2">Select Issue Category:</span>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`p-3 rounded-card border flex items-center gap-3 text-left transition-all cursor-pointer ${category === c.id
                        ? "bg-primary/15 border-primary text-text-1 shadow-sm font-semibold"
                        : "bg-white/5 border-glass-border text-text-2 hover:bg-white/10"
                      }`}
                  >
                    <div className="p-2 rounded-lg bg-black/30 shrink-0">{c.icon}</div>
                    <span className="text-xs">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-2">Set Incident Coordinates:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setLat(pos.coords.latitude);
                        setLng(pos.coords.longitude);
                        addToast({ type: "safe", title: "GPS Acquired", message: "Current location synced." });
                      });
                    }
                  }}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Use My Location</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-text-3 font-mono">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value))}
                    className="w-full h-10 px-3 rounded-input bg-bg-2 border border-glass-border text-xs text-text-1 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-text-3 font-mono">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(parseFloat(e.target.value))}
                    className="w-full h-10 px-3 rounded-input bg-bg-2 border border-glass-border text-xs text-text-1 font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-3">Pinned near Pune municipal jurisdiction.</p>
            </div>
          )}

          {/* Step 3: Description */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-2">Incident Description:</span>
                <span className="text-[11px] font-mono text-text-3">{description.length}/500</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Describe what happened, exact landmark, and any immediate hazards to pedestrians or vehicles..."
                className="w-full p-3 rounded-card bg-bg-2 border border-glass-border text-xs text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
              <p className="text-[11px] text-text-3">
                Tip: Including street names or intersections increases AI verification confidence (+15%).
              </p>
            </div>
          )}

          {/* Step 4: Media Upload & Voice Note */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-text-2">Attach Photo (Optional):</span>
                {photoPreview ? (
                  <div className="relative w-full h-36 rounded-card overflow-hidden border border-glass-border">
                    <img src={photoPreview} alt="Upload preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:text-danger cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-28 rounded-card border-2 border-dashed border-glass-border hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/5 transition-colors">
                    <Camera className="w-6 h-6 text-text-3" />
                    <span className="text-xs text-text-2">Tap to take photo or upload</span>
                    <span className="text-[10px] text-text-3">EXIF GPS stripped automatically</span>
                    <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  </label>
                )}
              </div>

              {/* Voice Note */}
              <div className="space-y-2 pt-2 border-t border-glass-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-2">Voice Note (Speech-to-Text):</span>
                  {isRecording && <span className="text-xs text-danger animate-pulse font-semibold">Recording...</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isRecording
                        ? "bg-danger text-white border-danger ring-4 ring-danger/20"
                        : "bg-white/5 text-text-2 border-glass-border hover:text-text-1"
                      }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <p className="text-xs text-text-3 flex-1">
                    {voiceTranscript || "Press mic to dictate report in English or Marathi/Hindi transliterated."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-card bg-white/5 border border-glass-border space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-text-3 font-semibold uppercase">Category</span>
                  <span className="font-bold text-text-1 capitalize">{category.replace("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-text-3 font-semibold uppercase">Coordinates</span>
                  <span className="font-mono text-text-1">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-text-3 font-semibold uppercase block mb-1">Description</span>
                  <p className="text-text-2 leading-relaxed">{description || "No description provided."}</p>
                </div>
                {photoFile && (
                  <div className="pt-2 text-[11px] text-safe flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Photo attached ({Math.round(photoFile.size / 1024)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-glass-border">
            {step > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && description.trim().length < 5}
              >
                Next Step
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={description.trim().length < 5}
                className="gap-2 shadow-lg shadow-primary/25"
              >
                <Sparkles className="w-4 h-4" />
                <span>Verify & Submit</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
