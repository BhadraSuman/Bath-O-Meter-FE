import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Camera, RefreshCw, Droplets, UserX, AlertCircle } from "lucide-react";

// 1. Define the shape of our API response
interface HygieneResult {
    status: string;
    label: "fresh_clean" | "needs_bath";
    confidence: string;
    verdict: string;
}

const API_URL = import.meta.env.VITE_API_URL as string;

const App: React.FC = () => {
    // 2. Type-safe refs and state
    const webcamRef = useRef<Webcam>(null);
    const [result, setResult] = useState<HygieneResult | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const captureAndCheck = useCallback(async () => {
        if (!webcamRef.current) return;

        setLoading(true);
        setError(null);

        // Get screenshot as base64
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError("Could not capture image from webcam.");
            setLoading(false);
            return;
        }

        try {
            // 3. Convert base64 to Blob for Multipart upload
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append("file", file);

            // 4. Send to FastAPI
            const apiResponse = await axios.post<HygieneResult>(API_URL, formData);
            setResult(apiResponse.data);
        } catch (err) {
            console.error("API Error:", err);
            setError("Failed to connect to the Bath-O-Meter backend.");
        } finally {
            setLoading(false);
        }
    }, [webcamRef]);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-8 font-sans">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 tracking-tight">
                    Bath-O-Meter <Droplets className="text-cyan-400" />
                </h1>
                <p className="text-slate-400 mt-2 font-medium">Vertex AI • TypeScript • FastAPI</p>
            </header>

            <main className="w-full max-w-lg flex flex-col items-center">
                <div className="relative w-full  rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black aspect-square">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover "
                        videoConstraints={{ facingMode: "user" }}
                    />

                    {loading && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
                            <RefreshCw className="animate-spin w-12 h-12 text-cyan-400 mb-4" />
                            <p className="font-bold text-lg animate-pulse">Analyzing hygiene...</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={captureAndCheck}
                    disabled={loading}
                    className="mt-8 group relative inline-flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 px-10 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-cyan-900/20"
                >
                    <Camera className="group-hover:rotate-12 transition-transform" />
                    {loading ? "Processing..." : "Judge My Look"}
                </button>

                {error && (
                    <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-950/30 p-4 rounded-xl border border-red-500/50">
                        <AlertCircle size={20} />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}

                {result && (
                    <div
                        className={`mt-10 p-8 rounded-3xl text-center w-full border-b-8 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                            result.label === "fresh_clean"
                                ? "bg-emerald-950/20 border-emerald-500 text-emerald-100 shadow-xl shadow-emerald-900/10"
                                : "bg-rose-950/20 border-rose-500 text-rose-100 shadow-xl shadow-rose-900/10"
                        }`}
                    >
                        <div className="flex justify-center mb-4">
                            {result.label === "fresh_clean" ? (
                                <Droplets className="w-16 h-16 text-emerald-400" />
                            ) : (
                                <UserX className="w-16 h-16 text-rose-400" />
                            )}
                        </div>
                        <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">{result.verdict}</h2>
                        <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-sm font-mono mt-2">
                            AI Confidence: {result.confidence}
                        </div>
                    </div>
                )}
            </main>

            <footer className="mt-12 p-4 text-center max-w-lg">
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        <span className="font-bold text-cyan-400">DISCLAIMER:</span> This app was built using 100% organic code and 0% actual soap. Our AI model is smart, but it can’t actually smell you (yet). Whether you're sparkling clean or just survived a 48-hour hackathon, we might get it wrong. Use this result for entertainment only—don't let an algorithm be the reason you skip a shower! 🧼
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;
