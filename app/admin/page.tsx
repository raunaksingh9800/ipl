"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Eye, Send, Users, Activity } from "lucide-react";
import io, { Socket } from "socket.io-client";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [tossPred, setTossPred] = useState("");
  const [matchPred, setMatchPred] = useState("");
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, { role: string, content: string }[]>>({});
  const [chatInput, setChatInput] = useState("");
  
  const [currentTime, setCurrentTime] = useState("");
  const [todayMatch, setTodayMatch] = useState("Loading...");

  const chatEndRef = useRef<HTMLDivElement>(null);

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

      // Connect Socket
      const newSocket = io("http://localhost:3001");
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("identify", { role: "admin" });
      });

      newSocket.on("active_users", (users) => {
        setActiveUsers(users);
        users.forEach((u: any) => {
           if (!messages[u.id]) setMessages(prev => ({ ...prev, [u.id]: [] }));
        });
      });

      newSocket.on("user_connected", (user) => {
        setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      });

      newSocket.on("user_disconnected", (socketId) => {
        setActiveUsers(prev => prev.filter(u => u.id !== socketId));
        if (selectedUser === socketId) setSelectedUser(null);
      });

      newSocket.on("receive_user_message", ({ from, text }) => {
        setMessages(prev => {
          const userMsgs = prev[from] || [];
          return { ...prev, [from]: [...userMsgs, { role: "user", content: text }] };
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated]);

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

  const sendChatMessage = () => {
    if (!chatInput.trim() || !selectedUser || !socket) return;
    
    socket.emit("admin_message", { to: selectedUser, text: chatInput });
    
    setMessages(prev => {
      const userMsgs = prev[selectedUser] || [];
      return { ...prev, [selectedUser]: [...userMsgs, { role: "agent", content: chatInput }] };
    });
    
    setChatInput("");
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
          
          <div className="space-y-6">
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
