"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Zap, Info, LogIn } from "lucide-react";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [matchData, setMatchData] = useState("Loading Match Data...");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check auth
    setIsLoggedIn(!!localStorage.getItem("prophet_user_id"));

    // Fetch dynamic match data
    const fetchMatch = async () => {
      try {
        const response = await fetch('/matches.csv');
        const text = await response.text();
        const rows = text.split('\n');
        
        // Format today's date to match CSV format (e.g. "05-APR-26")
        const today = new Date();
        const formattedToday = today.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit"
        }).toUpperCase().replace(/ /g, '-');

        const todayMatches = [];
        for (let i = 1; i < rows.length; i++) {
          const matchCols = rows[i].split(',');
          if (matchCols.length > 5 && matchCols[1] === formattedToday) {
            todayMatches.push(`${matchCols[4]} vs ${matchCols[5]}`);
          }
        }

        if (todayMatches.length > 0) {
          setMatchData(todayMatches.join(' & '));
        } else {
          setMatchData("No matches scheduled today");
        }
        
      } catch (err) {
        console.error("Match fetch failed:", err);
        setMatchData("SRH vs LSG"); // Fallback
      }
    };
    
    fetchMatch();

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800); // Wait 2.8 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-5xl md:text-7xl font-serif tracking-widest uppercase text-accent font-bold text-center px-4"
            >
              Predicted<br /><span className="text-foreground">By God</span>
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <>
          <div className="absolute top-8 right-6 md:top-12 md:right-12 z-50">
            {isLoggedIn ? (
              <Link href="/prediction" className="inline-flex items-center gap-2 text-zinc-500 hover:text-accent uppercase tracking-widest text-xs font-semibold transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-in" className="inline-flex items-center gap-2 text-zinc-500 hover:text-accent uppercase tracking-widest text-xs font-semibold transition-colors">
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col items-center justify-center w-full max-w-4xl px-6 py-12 relative"
          >
          {/* Chip */}
          <div className="border border-accent/30 bg-accent/5 px-4 py-1.5 mb-8 flex items-center gap-2 uppercase tracking-widest text-xs font-semibold text-accent max-w-[90vw] text-center">
            <span className="shrink-0 w-2 h-2 bg-accent animate-pulse" style={{ borderRadius: 0 }}></span>
            <span className="truncate">Today's Match: {matchData}</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-center font-bold tracking-tight mb-6">
            Absolute <span className="text-accent italic">Precision.</span>
          </h2>

          <p className="max-w-2xl text-center text-lg md:text-xl text-zinc-400 mb-12 font-light leading-relaxed">
            Harnessing the most advanced predictive algorithms and divinely inspired data models to bring you the exact outcome, before a single ball is bowled.
          </p>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-6">
            {isLoggedIn ? (
              <Link
                href="/prediction"
                className="group relative flex w-full sm:w-auto items-center justify-center gap-3 bg-accent text-black px-8 py-4 font-bold tracking-widest uppercase hover:bg-accent/80 transition-all duration-300"
              >
                <Zap className="w-5 h-5 fill-black" />
                <span>Resume Prediction</span>
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="group relative flex w-full sm:w-auto items-center justify-center gap-3 bg-foreground text-background px-8 py-4 font-bold tracking-widest uppercase hover:bg-accent hover:text-black transition-all duration-300"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>Predict at 25₹</span>
              </Link>
            )}

            <Link
              href="/learn-more"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 border border-zinc-800 bg-transparent px-8 py-4 font-semibold tracking-widest uppercase text-zinc-300 hover:border-accent hover:text-accent transition-all duration-300"
            >
              <Info className="w-5 h-5" />
              <span>Learn More</span>
            </Link>
          </div>

          <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full border-t border-zinc-900 pt-12">
            {[
              { label: "Prophet AI", val: "v4.2" },
              { label: "Accuracy", val: "90.9%" },
              { label: "Trusted By", val: "1000+" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center space-y-2">
                <span className="text-sm font-light text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                <span className="text-3xl font-serif text-foreground font-bold">{stat.val}</span>
              </div>
            ))}
          </div>

          <footer className="mt-32 w-full pt-12 border-t border-zinc-900/50 flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-6">
              <Link href="/legal" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">Privacy Policy</Link>
              <Link href="/legal" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">Terms of Service</Link>
              <Link href="/legal" className="text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">Disclaimer</Link>
            </div>
            <p className="text-[10px] text-zinc-800 uppercase tracking-widest font-bold">© 2026 Prophet AI Predictor. All rights reserved.</p>
          </footer>

        </motion.main>
        </>
      )}
    </div>
  );
}
