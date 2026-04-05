"use client";

import Link from "next/link";
import { ArrowLeft, Send, Cpu, User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";

type Message = {
  role: "user" | "agent";
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", content: "Identity verified. I am Prophet AI v4.2. State your inquiry regarding match dynamics." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const newSocket = io("http://localhost:3001");
    setSocket(newSocket);

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      newSocket.emit("identify", {
        role: "user",
        name: user?.user_metadata?.full_name || "Unknown Interface",
        email: user?.email || "N/A"
      });
    };
    fetchUser();

    newSocket.on("receive_admin_message", (text) => {
      setMessages(prev => [...prev, { role: "agent", content: text }]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !socket) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    socket.emit("user_message", userMessage);
    setInput("");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
              {msg.role === "agent" ? (
                <div className="w-10 h-10 border border-accent flex items-center justify-center bg-[#050505] shrink-0">
                  <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} />
                </div>
              ) : (
                <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center bg-zinc-900 shrink-0">
                  <User className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                </div>
              )}
              
              <div className={`p-5 max-w-[80%] md:max-w-[70%] text-sm md:text-base leading-relaxed font-light ${
                msg.role === "agent" 
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
                <span className="ml-2 uppercase tracking-widest text-xs font-bold text-accent">Calculating...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-background/90 p-4 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto backdrop-blur-xl">
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
