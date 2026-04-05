"use client";

import Link from "next/link";
import { ArrowLeft, Send, Cpu, User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "admin";
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "admin", content: "Identity verified. I am Prophet AI v4.2. State your inquiry regarding match dynamics." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Unknown Interface");
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const storedId = localStorage.getItem("prophet_user_id");
    const storedName = localStorage.getItem("prophet_user_name");
    if (!storedId) {
      router.push("/sign-in");
      return;
    }
    setUserId(storedId);
    setUserName(storedName || "Unknown Interface");

    // Load previous messages for this user
    supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", storedId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const loaded = data.map((m: any) => ({ role: m.role as "user" | "admin", content: m.content }));
          setMessages(prev => [prev[0], ...loaded]);
        }
      });

    // Subscribe to new messages via Postgres Changes (reliable, persistent)
    const channel = supabase
      .channel(`chat_${storedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${storedId}`
        },
        (payload) => {
          const msg = payload.new as any;
          // Only append admin replies (user messages we add optimistically)
          if (msg.role === "admin") {
            setMessages(prev => [...prev, { role: "admin", content: msg.content }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically show message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Persist to DB — admin will see it via Postgres Changes
    await supabase.from("chat_messages").insert({
      user_id: userId,
      user_name: userName,
      role: "user",
      content: userMessage
    });

    setLoading(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("prophet_user_id");
    localStorage.removeItem("prophet_user_name");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/prediction" className="text-zinc-500 hover:text-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-accent animate-pulse"></div>
            <h1 className="font-serif font-bold tracking-widest uppercase">Prophet AI Interface</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-xs text-zinc-600 font-bold tracking-widest uppercase border border-zinc-800 px-3 py-1">
            Secure Channel
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sever Link
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "admin" ? (
                <div className="w-10 h-10 border border-accent flex items-center justify-center bg-[#050505] shrink-0">
                  <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} />
                </div>
              ) : (
                <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center bg-zinc-900 shrink-0">
                  <User className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                </div>
              )}
              <div className={`p-5 max-w-[80%] md:max-w-[70%] text-sm md:text-base leading-relaxed font-light ${
                msg.role === "admin"
                  ? "border border-zinc-800 bg-[#0a0a09] text-zinc-300"
                  : "bg-foreground text-background"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-4 flex-row">
              <div className="w-10 h-10 border border-accent flex items-center justify-center bg-[#050505] shrink-0">
                <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} />
              </div>
              <div className="p-5 border border-zinc-800 bg-[#0a0a09] text-zinc-500 font-light text-sm italic flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent inline-block animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-accent inline-block animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-accent inline-block animate-bounce delay-200"></span>
                <span className="ml-2 uppercase tracking-widest text-xs font-bold text-accent">Transmitting...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-background/90 p-4 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the Prophet model..."
              className="w-full border border-zinc-800 bg-transparent py-4 pl-6 pr-16 text-foreground placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-0 transition-colors font-light"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 bg-foreground text-background px-4 flex items-center justify-center hover:bg-accent hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-3 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            Insights are absolute. Do not second-guess the model.
          </div>
        </div>
      </div>
    </div>
  );
}
