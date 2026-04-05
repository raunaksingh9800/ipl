"use client";

import Link from "next/link";
import { Copy, Navigation, CheckCircle, LogOut, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Prediction() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("Toss Prediction");
  const [predData, setPredData] = useState({ toss: "Pending", match: "Pending", insight: "" });
  const router = useRouter();

  useEffect(() => {
    // Fetch User
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata.full_name || null);
        setUserTier(user.user_metadata.tier || "Toss Prediction");
      }
    };
    fetchUser();

    // Fetch Predictions from Admin Data
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/predictions');
        const data = await res.json();
        setPredData(data);
      } catch (err) {
        console.error("Error fetching predictions", err);
      }
    };
    fetchPredictions();

    // Simulate calculating/fetching prediction
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleChatAccess = () => {
    if (userTier !== "Talk to Agent") {
      if (confirm("You need the Talk to Agent tier (₹100) to access Prophet AI Chat. Upgrade now?")) {
        router.push("/pricing");
      }
    } else {
      router.push("/chatbot");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground py-20 px-6 font-sans">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-start md:items-center mb-16 border-b border-zinc-900 pb-8 flex-col md:flex-row gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold uppercase tracking-widest">
              Oracle <span className="text-accent italic">Analysis</span>
            </h1>
            {userName && (
              <p className="text-sm mt-2 text-zinc-400 font-light tracking-wide flex items-center gap-2">
                Welcome, <span className="text-accent font-medium uppercase">{userName}</span>
                <span className="text-[10px] bg-accent/10 border border-accent/20 px-2 rounded-none text-accent uppercase tracking-widest font-bold">{userTier}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={handleChatAccess} className="text-sm font-bold uppercase tracking-widest border border-zinc-800 px-6 py-2 hover:border-accent hover:text-accent transition-colors">
              Consult Agent
            </button>
            <button
              onClick={handleSignOut}
              className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sever Link
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-t-2 border-accent rounded-full animate-spin mb-8" style={{ borderRadius: 0 }}></div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 animate-pulse">Running probabilistic models...</p>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in relative">
            <div className="absolute top-0 right-0 p-4 border border-accent/20 bg-accent/5 hidden md:block">
              <p className="text-[10px] text-accent uppercase tracking-widest font-mono">Confidence: 99.4%</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">Variance: ±0.6%</p>
            </div>

            <div className="border border-zinc-800 bg-zinc-900/10 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>

              <div className="pt-8">
                <div className="flex min-h-[400px]">
                  {/* Left panel - The Prediction */}
                  <div className="w-full md:w-2/3 p-8 md:p-12 border-r border-zinc-900 flex flex-col justify-center">

                    <div className="mb-12">
                      <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Predicted Toss Winner</h2>
                      <div className="text-2xl font-serif font-bold text-zinc-300 uppercase tracking-widest">
                        {predData.toss}
                      </div>
                    </div>

                    <div className={userTier === "Toss Prediction" ? "relative blur-md pointer-events-none select-none opacity-50" : ""}>
                      {userTier === "Toss Prediction" && (
                        <div className="absolute inset-0 flex items-center justify-center z-10" style={{ filter: 'none' }}>
                        </div>
                      )}
                      <div>
                        <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-accent" /> Match Winner Query Result
                        </h2>
                        <div className="text-4xl md:text-5xl font-serif font-extrabold uppercase tracking-tight text-foreground leading-tight">
                          {predData.match}
                        </div>
                      </div>
                      
                      {predData.insight && (
                        <div className="mt-8 pt-8 border-t border-zinc-900">
                          <h2 className="text-xs text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" /> Prophet AI Insight
                          </h2>
                          <p className="text-sm text-zinc-400 font-light italic leading-relaxed border-l-2 border-zinc-800 pl-4">
                            "{predData.insight}"
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {userTier === "Toss Prediction" && (
                      <div className="mt-8 p-4 border border-zinc-800 bg-background/50 flex flex-col items-center justify-center text-center">
                        <span className="bg-zinc-800 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Restricted Access</span>
                        <p className="text-xs text-zinc-400">Match prediction locked. Upgrade to Match Tier (₹25) to unlock insight.</p>
                      </div>
                    )}

                  </div>

                  <div className="hidden md:flex flex-col justify-center p-8">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                    <div className="text-sm font-bold text-green-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 animate-pulse"></span> Live Valid
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation snippet */}


          </div>
        )}
      </div>
    </div>
  );
}
