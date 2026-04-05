"use client";

import Link from "next/link";
import { ArrowLeft, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/utils/supabase/client";
import { uploadFiles } from "@/utils/uploadthing";
import imageCompression from "browser-image-compression";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";

function CheckoutContent() {
  const router = useRouter();

  const [tierName, setTierName] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [utr, setUtr] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'success' }>({
    isOpen: false, title: "", message: "", type: "error"
  });

  useEffect(() => {
    const storedTier = localStorage.getItem("checkout_tier");
    const storedAmount = localStorage.getItem("checkout_amount");
    if (!storedTier || !storedAmount) {
      router.push("/pricing");
    } else {
      setTierName(storedTier);
      setAmount(storedAmount);
    }
    setIsInitializing(false);
  }, [router]);

  const handleManualSubmit = async () => {
    if (!proofFile && !utr) {
      setModal({ isOpen: true, title: "Missing Data", message: "Please attach a screenshot or enter a UTR number to proceed.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem("prophet_user_id");
      const userName = localStorage.getItem("prophet_user_name");
      if (!userId) throw new Error("Unauthenticated. Please sign in.");

      let proofUrl = null;
      if (proofFile) {
        try {
          let fileToUpload = proofFile;
          try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
            fileToUpload = await imageCompression(proofFile, options);
          } catch (error) {
            console.warn("Compression failed, using original file", error);
          }

          const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
          const fileName = `${userId}_${Date.now()}.${fileExt}`;

          // Recreate file with exact name we want before transmitting
          const renamedFile = new File([fileToUpload], fileName, { type: fileToUpload.type || 'image/jpeg' });

          const response = await uploadFiles("imageUploader", {
            files: [renamedFile],
          });

          if (response && response.length > 0) {
            proofUrl = response[0].url;
          } else {
            console.warn("UploadThing silent bypass: array empty");
          }
        } catch (storageErr) {
          console.warn("UploadThing bypassed strictly due to error:", storageErr);
        }
      }

      await supabase.from("transactions").insert({
        user_id: userId,
        user_name: userName || "Unknown",
        tier_name: tierName,
        amount: parseInt(amount as string),
        utr_id: utr || null,
        proof_url: proofUrl,
        status: "pending"
      });

      setModal({ isOpen: true, title: "Verification Queued", message: "Your transaction has been beamed to our proxy nodes. Access will be unlocked shortly.", type: "success" });
      setTimeout(() => {
        router.push("/prediction");
      }, 3500);

    } catch (e: any) {
      console.error(e);
      setModal({ isOpen: true, title: "Transmission Failed", message: e.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing || !tierName || !amount) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground py-20 px-6 font-sans relative">
      <div className="absolute top-8 left-8">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-zinc-500 hover:text-foreground uppercase tracking-widest text-xs font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
      </div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-12 items-center md:items-stretch">

        {/* Left Side: QR & Amount */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center border border-zinc-800 p-12 bg-zinc-900/10 backdrop-blur-sm shadow-2xl relative">
          <div className="absolute top-0 right-0 bg-accent text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1">
            {tierName}
          </div>

          <h2 className="text-2xl font-bold uppercase tracking-widest text-accent mb-2">Scan & Pay</h2>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-12 text-center">Use any UPI app (GPay, PhonePe, Paytm)</p>

          <div className="bg-white p-6 mb-8 border border-zinc-700">
            <QRCode
              value={`upi://pay?pa=raunaksingh@yesg&pn=Raunak&am=${amount}&cu=INR`}
              size={240}
            />
          </div>
          <p className="text-white text-5xl font-bold font-serif shadow-sm">₹{amount}</p>

          <a
            href={`upi://pay?pa=raunaksingh@yesg&pn=Raunak&am=${amount}&cu=INR`}
            className="mt-8 md:hidden w-full bg-accent text-black uppercase tracking-widest font-bold py-4 text-xs hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            Pay with your UPI App
          </a>
        </div>

        {/* Right Side: Upload Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4 uppercase">
              Verify Transfer
            </h1>
            <p className="text-sm text-zinc-400 font-light leading-relaxed">
              To finalize your connection to the grid, transmit the proof of your transaction below. Our proxy nodes will verify it momentarily.
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-zinc-900">
            <div>
              <label className="block text-xs font-bold text-zinc-500 tracking-widest uppercase mb-3">1. Attach Screenshot (Required)</label>
              <div className="border border-zinc-800 border-dashed p-8 flex flex-col items-center justify-center bg-zinc-900/30 hover:bg-zinc-900/80 transition-colors cursor-pointer relative min-h-[160px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files && setProofFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />

                {loading ? (
                  <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-600 mb-4 group-hover:text-zinc-400 transition-colors" />
                )}

                <span className="text-sm text-zinc-300 tracking-wide font-mono">
                  {loading ? "Transmitting..." : (proofFile ? proofFile.name : "Click or drag proof.jpg here")}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 tracking-widest uppercase mb-3">2. UTR/Reference ID (Optional)</label>
              <input
                type="text"
                value={utr}
                onChange={e => setUtr(e.target.value)}
                placeholder="e.g. 431289139824"
                className="w-full bg-zinc-900 border border-zinc-800 p-4 font-mono text-sm focus:outline-none focus:border-accent text-zinc-200"
              />
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={loading}
              className="w-full mt-4 bg-accent text-black uppercase tracking-widest font-bold py-5 text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transmitting...
                </>
              ) : (
                "Submit Verification"
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Brutalist Modal Overlay */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-700 p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">

            {modal.type === 'error' ? (
              <AlertCircle className="w-12 h-12 text-red-500 mb-6 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            ) : (
              <CheckCircle className="w-12 h-12 text-accent mb-6 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
            )}

            <h3 className="text-2xl font-bold font-serif mb-3 uppercase tracking-widest text-white">
              {modal.title}
            </h3>

            <p className="text-zinc-400 text-sm mb-8 leading-relaxed font-mono">
              {modal.message}
            </p>

            {modal.type === 'error' ? (
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 text-xs hover:bg-zinc-200 transition-colors"
              >
                Acknowledge & Return
              </button>
            ) : (
              <div className="w-full border border-zinc-800 p-4 text-xs font-mono text-zinc-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Auto-redirecting to dashboard...
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans"><div className="w-16 h-16 border-t-2 border-accent mb-8" style={{ borderRadius: 0 }}></div></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
