"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Eye, Send, Users, Activity, Check, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [tossPred, setTossPred] = useState("");
  const [matchPred, setMatchPred] = useState("");
  
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  
  const [activeUsers, setActiveUsers] = useState<{id: string; name: string; email: string}[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { role: string, content: string }[]>>({});
  const [chatInput, setChatInput] = useState("");
  
  const [currentTime, setCurrentTime] = useState("");
  const [todayMatch, setTodayMatch] = useState("Loading...");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const userChannelsRef = useRef<Record<string, ReturnType<typeof supabase.channel>>>({}); // kept for cleanup

  useEffect(() => {
    // Current Time Clock
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-GB")); // 24hr format
    }, 1000);
    
    // Fetch Today's Match
    const fetchMatch = async () => {
      try {
        const response = await fetch('/matches.csv');
        const text = await response.text();
        const rows = text.split('\n');
        
        const today = new Date();
        const formattedToday = today.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "2-digit"
        }).toUpperCase().replace(/ /g, '-');

        const todayMatches = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',');
          if (cols.length > 5 && cols[1] === formattedToday) {
            todayMatches.push(`${cols[4]} v ${cols[5]}`);
          }
        }
        setTodayMatch(todayMatches.length > 0 ? todayMatches.join(' | ') : "No match today");
      } catch (err) {
        setTodayMatch("Error fetching matches");
      }
    };
    fetchMatch();

    return () => clearInterval(timer);
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // Connect socket and fetch predictions after auth
  useEffect(() => {
    if (isAuthenticated) {
      // Load current predictions
      fetch('/api/predictions')
        .then(res => res.json())
        .then(data => {
          setTossPred(data.toss || "");
          setMatchPred(data.match || "");
        });

      // Poll matching manual transactions
      const fetchTxs = async () => {
        const { data } = await supabase.from('transactions').select('*').eq('status', 'pending');
        if (data) setPendingTxs(data);
      };
      fetchTxs();
      const txInterval = setInterval(fetchTxs, 5000);

      // Load existing chat history to populate Live Targets on mount
      (async () => {
        const { data: existingMsgs, error: chatErr } = await supabase
          .from("chat_messages")
          .select("*")
          .order("created_at", { ascending: true });

        if (chatErr) {
          console.error("chat_messages table error (run SQL to create it):", chatErr.message);
        } else if (existingMsgs && existingMsgs.length > 0) {
          const usersMap: Record<string, { id: string; name: string; email: string }> = {};
          const msgsMap: Record<string, { role: string; content: string }[]> = {};
          existingMsgs.forEach((m: any) => {
            if (!usersMap[m.user_id]) {
              usersMap[m.user_id] = { id: m.user_id, name: m.user_name || "Unknown", email: "" };
            }
            if (!msgsMap[m.user_id]) msgsMap[m.user_id] = [];
            msgsMap[m.user_id].push({ role: m.role, content: m.content });
          });
          setActiveUsers(Object.values(usersMap));
          setMessages(msgsMap);
        }
      })();

      // Subscribe to chat_messages via Postgres Changes (DB-backed, reliable everywhere)
      const chatChannel = supabase
        .channel("admin_chat_watch")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          (payload) => {
            const msg = payload.new as any;
            if (msg.role === "user") {
              // Add user to active list if new
              setActiveUsers(prev => {
                if (!prev.find(u => u.id === msg.user_id)) {
                  return [...prev, { id: msg.user_id, name: msg.user_name || "Unknown", email: "" }];
                }
                return prev;
              });
              // Append message to that user's thread
              setMessages(prev => {
                const existing = prev[msg.user_id] || [];
                return { ...prev, [msg.user_id]: [...existing, { role: "user", content: msg.content }] };
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(chatChannel);
        clearInterval(txInterval);
      };
    }
  }, [isAuthenticated]);

  const handleApproveTx = async (txId: string) => {
    await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId);
    setPendingTxs(prev => prev.filter(t => t.id !== txId));
  };
  
  const handleRejectTx = async (txId: string) => {
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', txId);
    setPendingTxs(prev => prev.filter(t => t.id !== txId));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin-auth', {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (res.ok) setIsAuthenticated(true);
    else alert("Access Denied");
  };

  const handleUpdatePredictions = async () => {
    await fetch('/api/predictions', {
      method: "POST",
      body: JSON.stringify({ toss: tossPred, match: matchPred })
    });
    alert("Predictions Updated Successfully");
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedUser) return;
    const text = chatInput.trim();
    setChatInput("");

    // Show optimistically in admin UI
    setMessages(prev => {
      const userMsgs = prev[selectedUser] || [];
      return { ...prev, [selectedUser]: [...userMsgs, { role: "admin", content: text }] };
    });

    // Insert into chat_messages — user's Postgres Changes listener will pick it up
    const user = activeUsers.find(u => u.id === selectedUser);
    await supabase.from("chat_messages").insert({
      user_id: selectedUser,
      user_name: user?.name || "Unknown",
      role: "admin",
      content: text
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <form onSubmit={handleLogin} className="border border-zinc-800 p-8 w-full max-w-md bg-background relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
          <div className="flex items-center gap-3 mb-8">
            <Lock className="w-6 h-6 text-accent" />
            <h1 className="text-xl font-bold tracking-widest uppercase">Prophet AI Override</h1>
          </div>
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 mb-2 uppercase">Vessel Username</label>
              <input 
                type="text" 
                value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-transparent border border-zinc-700 p-3 text-sm focus:outline-none focus:border-accent text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 mb-2 uppercase">Root Access Key</label>
              <input 
                type="password" 
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent border border-zinc-700 p-3 text-sm focus:outline-none focus:border-accent text-foreground"
              />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-foreground text-background font-bold uppercase tracking-widest py-3 text-sm hover:bg-accent transition-colors">
            Breach Mainframe
          </button>
        </form>
      </div>
    );
  }

  const activeMessages = selectedUser ? (messages[selectedUser] || []) : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <header className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center bg-zinc-900/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-accent" />
            <h1 className="font-serif font-bold tracking-widest uppercase text-xl text-accent">God Mode Override</h1>
          </div>
          <div className="hidden md:flex border-l border-zinc-800 pl-6 gap-6">
            <div className="text-xs uppercase tracking-widest font-bold text-zinc-400">
              <span className="text-zinc-600 block text-[10px]">Active Operation</span>
              {todayMatch}
            </div>
            <div className="text-xs uppercase tracking-widest font-bold text-zinc-400">
              <span className="text-zinc-600 block text-[10px]">Server Local Time</span>
              {currentTime || "00:00:00"}
            </div>
          </div>
        </div>
        <div className="text-xs tracking-widest text-green-500 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          System Active
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-65px)]">
        
        {/* Left Column: Predictions */}
        <div className="w-1/3 border-r border-zinc-800 p-6 flex flex-col overflow-y-auto">
          <h2 className="text-lg font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Match Variables
          </h2>
          
          <div className="space-y-6 mb-12">
            <div className="p-4 border border-zinc-800 bg-zinc-900/20">
              <label className="block text-xs font-bold tracking-widest text-zinc-500 mb-3 uppercase">Predicted Toss Winner</label>
              <input 
                type="text" 
                value={tossPred} onChange={e => setTossPred(e.target.value)}
                placeholder="e.g. SRH (Elects to bowl)"
                className="w-full bg-transparent border border-zinc-700 p-3 text-sm focus:outline-none focus:border-accent text-foreground"
              />
            </div>

            <div className="p-4 border border-zinc-800 bg-zinc-900/20">
              <label className="block text-xs font-bold tracking-widest text-zinc-500 mb-3 uppercase">Predicted Match Winner</label>
              <input 
                type="text" 
                value={matchPred} onChange={e => setMatchPred(e.target.value)}
                placeholder="e.g. Sunrisers Hyderabad"
                className="w-full bg-transparent border border-zinc-700 p-3 text-sm focus:outline-none focus:border-accent text-foreground"
              />
            </div>
            
            <button 
              onClick={handleUpdatePredictions}
              className="w-full bg-accent text-black font-bold uppercase tracking-widest py-3 text-sm hover:opacity-90 transition-opacity"
            >
              Push Truth to Matrix
            </button>
          </div>

          <h2 className="text-lg font-bold tracking-widest uppercase mb-6 flex items-center gap-2 text-zinc-300 border-t border-zinc-800 pt-8">
            <ImageIcon className="w-4 h-4 text-accent" /> Proof Verifications
          </h2>
          
          {pendingTxs.length === 0 ? (
            <p className="text-xs text-zinc-600 uppercase tracking-widest">No pending transactions.</p>
          ) : (
            <div className="space-y-4">
              {pendingTxs.map(tx => (
                <div key={tx.id} className="border border-zinc-800 p-4 bg-zinc-900/40">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-sm">{tx.user_name}</p>
                      <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">{tx.tier_name}</p>
                    </div>
                    <span className="text-accent font-bold font-serif">₹{tx.amount}</span>
                  </div>
                  
                  {tx.utr_id && (
                    <p className="text-xs text-zinc-500 block mb-2 font-mono">UTR: {tx.utr_id}</p>
                  )}
                  
                  {tx.proof_url && (
                    <a href={tx.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline mb-4 inline-block block">
                      View Screenshot Proof
                    </a>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleApproveTx(tx.id)} className="flex-1 bg-green-900/30 text-green-500 border border-green-900/50 hover:bg-green-900/50 py-2 text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1 transition-colors">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleRejectTx(tx.id)} className="flex-1 bg-red-900/30 text-red-500 border border-red-900/50 hover:bg-red-900/50 py-2 text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1 transition-colors">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Column: Active Users */}
        <div className="w-1/4 border-r border-zinc-800 flex flex-col bg-zinc-900/10">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Live Targets ({activeUsers.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeUsers.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                className={`w-full text-left p-4 border-b border-zinc-800 transition-colors ${selectedUser === user.id ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-zinc-800/50'}`}
              >
                <div className="text-sm font-bold truncate text-foreground">{user.name || "Unknown User"}</div>
                <div className="text-xs text-zinc-500 truncate mt-1">{user.email || user.id}</div>
              </button>
            ))}
            {activeUsers.length === 0 && (
              <div className="p-6 text-center text-zinc-600 text-xs uppercase tracking-widest">
                No active connections
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-widest">Talking to Subject: <span className="text-accent">{activeUsers.find(u=>u.id===selectedUser)?.name}</span></span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] p-4 text-sm ${
                      msg.role === "user" 
                        ? "bg-zinc-900 border border-zinc-800 text-zinc-300"
                        : "bg-accent/10 border border-accent/30 text-foreground"
                    }`}>
                      <div className={`text-[10px] uppercase tracking-widest mb-2 font-bold ${msg.role === "admin" ? "text-accent" : "text-zinc-500"}`}>
                        {msg.role === "user" ? "Target" : "Prophet AI"}
                      </div>
                      <div className="leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t border-zinc-800 bg-background flex gap-4">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Draft divine revelation..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 p-3 text-sm focus:outline-none focus:border-accent text-foreground"
                />
                <button
                  onClick={sendChatMessage}
                  className="bg-accent text-black px-6 flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm tracking-widest uppercase">
              Select a target to establish connection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
