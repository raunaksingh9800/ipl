"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.from('custom_users').insert({
      email,
      password,
      full_name: name
    }).select().single();

    setLoading(false);

    if (error || !data) {
      setErrorMsg(error?.message || "Failed to create user.");
    } else {
      localStorage.setItem("prophet_user_id", data.id);
      localStorage.setItem("prophet_user_name", data.full_name);

      if (localStorage.getItem("pending_payment_amount")) {
        router.push("/pricing");
      } else {
        router.push("/prediction");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-background font-sans">
      
      {/* Left side: Premium Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground text-background p-12">
        <div>
          <Link href="/" className="text-xl font-serif font-bold uppercase tracking-widest hover:text-accent transition-colors">
            Oracle
          </Link>
        </div>
        <div>
          <h2 className="text-5xl font-serif font-bold leading-tight mb-6">
            Forge an <br/><span className="text-accent italic">Identity.</span>
          </h2>
          <p className="text-zinc-400 font-light max-w-sm text-lg">
            Create your Oracle profile to permanently link your psychic destiny with our quantum models.
          </p>
        </div>
        <div className="text-xs uppercase tracking-widest text-zinc-600 font-bold">
          © 2026 Oracle Predictions Ltd
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-[#050505]">
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-3xl font-serif font-bold text-foreground">Sign Up</h1>
            <UserPlus className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 mb-6 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">
                Full Name
              </label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b border-zinc-300 dark:border-zinc-800 bg-transparent py-3 text-foreground placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
                placeholder="Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">
                Email Address
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-zinc-300 dark:border-zinc-800 bg-transparent py-3 text-foreground placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
                placeholder="identity@domain.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-zinc-500">
                Security Key (Password)
              </label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-zinc-300 dark:border-zinc-800 bg-transparent py-3 text-foreground placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 bg-foreground text-background py-4 font-bold uppercase tracking-widest hover:bg-accent hover:text-black transition-all mt-8"
            >
              {loading ? (
                 <span className="animate-pulse">Establishing Link...</span>
              ) : (
                <>
                  <span>Create Identity</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-xs text-zinc-500 font-light">
            Already authenticated? <Link href="/sign-in" className="font-bold text-foreground hover:text-accent">Sign In Here.</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
