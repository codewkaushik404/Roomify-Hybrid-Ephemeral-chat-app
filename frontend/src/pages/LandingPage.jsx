import { useEffect, useRef, useState } from "react";
import Toast from "../components/Toast"
import GlowOrb from "../components/ui/GlowOrb";
import {SquareDashedMousePointer, Copyright} from "lucide-react"
import UsernameModal from "../components/UsernameModal";
import { useSetRecoilState } from "recoil";
import { usernameAtom } from "../store/atoms/usernameAtom";
import { existingUsersAtom } from "../store/atoms/existingUsersAtom";
import { messagesAtom } from "../store/atoms/messagesAtom";

export default function LandingPage({setRoomId, socketRef, socketReady, setSocketReady}) {
  
  const inputRef = useRef(null);
  const [createdId, setCreatedId] = useState("");
  const [open, setOpen] = useState(false);
  const setUsername = useSetRecoilState(usernameAtom);
  const setExistingUsers = useSetRecoilState(existingUsersAtom);
  const setMessages = useSetRecoilState(messagesAtom);

  useEffect(()=>{
    if(!socketReady) return ;
    const socket = socketRef.current;

    function handleMessage(event){
      let parsedMessage;
      try{
        parsedMessage = JSON.parse(event.data);
      }catch(err){
        console.log("Invalid data format", err.message);
        socket.close();
        return ;
      }  
      
      if(parsedMessage.type === "room_created"){
        setCreatedId(parsedMessage.payload?.roomId);
      }

      if(parsedMessage.type === "room_joined"){
        const {roomId, existingUsers } = parsedMessage.payload;
        setExistingUsers(existingUsers);
        setRoomId(roomId);
      }

      if(parsedMessage.type === "old_messages"){
        const {messages} = parsedMessage.payload;
        if(messages.length > 0){
          setMessages(messages);
        }
      }

      if(parsedMessage.type === "error"){
        const {message, type} = parsedMessage.payload;
        message && Toast(message, type);
        return ;
      }
      
      if(parsedMessage.type === "warn"){
        const {message, type} = parsedMessage.payload;
        message && Toast(message, type);
        return
      }
    }

    function handleClose(){
        setRoomId("");
        setCreatedId("");
        setExistingUsers([]);
        setMessages([]);
        setUsername(null);
        socketRef.current = null;
        setSocketReady(false);
    }

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);

    return () => {
      socket.removeEventListener("message", handleMessage)
      socket.removeEventListener("close", handleClose);
    }
  },[socketReady]);

  
  function joinRoom(){
    if(!socketReady) return ;
    const socket = socketRef.current;
    const roomid = inputRef.current?.value?.trim();
    
    if(!socket) {
      Toast("Socket not connected", "error");
      return;
    }
    
    if(!roomid) {
      Toast("Please enter a room ID", "warn");
      return;
    }

    if(roomid.length < 5) {
      Toast("Room ID must be at least 5 characters", "warn");
      return;
    }
    setOpen(true);
  }

  function createRoom(){
    if(!socketReady || !socketRef.current){
      Toast("Socket not connected", "error");
      return ;
    }
    socketRef.current.send(JSON.stringify({type: "create_room"}));
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #E63946; color: #fff; }
        .glow-border {
          border: 1px solid rgba(230,57,70,0.35);
          box-shadow: 0 0 0 1px rgba(230,57,70,0.1), inset 0 0 20px rgba(230,57,70,0.04);
        }
        .input-glow:focus {
          outline: none;
          border-color: #E63946 !important;
          box-shadow: 0 0 0 3px rgba(230,57,70,0.15);
        }
        .btn-primary {
          background: #E63946;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: #ff4757;
          box-shadow: 0 0 30px rgba(230,57,70,0.4);
          transform: translateY(-1px);
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.25s ease;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(230,57,70,0.3);
          transform: translateY(-2px);
        }
        .chat-bubble {
          animation: slideIn 0.4s ease forwards;
          opacity: 0;
        }
        @keyframes slideIn {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .nav-link {
          color: rgba(255,255,255,0.5);
          transition: color 0.2s;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
        }
        .nav-link:hover { color: #fff; }
        .badge {
          background: rgba(230,57,70,0.15);
          border: 1px solid rgba(230,57,70,0.3);
          color: #E63946;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        .tag-pulse::before {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          background: #E63946;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}
      </style>

      {/* Background orbs */}
      <GlowOrb top="-10%" left="5%" color="#e24646" size="600px" />
      <GlowOrb top="50%" left="60%" color="#d97272" size="600px" />
      <GlowOrb top="40%" left="5%" color="#d97272" size="600px" />

      { open && <UsernameModal setRoomId={setRoomId} setOpen={setOpen} 
      inputRef={inputRef} socketRef={socketRef} 
      />
      }
      {/* Grid overlay */}
      <div className="absolute inset-0 grid-bg pointer-events-none" style={{ zIndex: 0 }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "#E63946" }}>
            <SquareDashedMousePointer size="22px"/>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Roomify</span>
        </div>
        <button
          onClick={joinRoom}
          className="btn-primary text-white text-sm font-semibold px-5 py-2 rounded-lg"
        >
          Launch Room 
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 py-10 mb-8">
        <div className="badge px-3 pb-1 pt-0.5 rounded-full mb-6 inline-flex items-center">
          <span className="tag-pulse text-md">Now live</span>
        </div>

        <h1
          className="text-white font-extrabold leading-none mb-6"
          style={{ fontSize: "clamp(48px, 8vw, 80px)", letterSpacing: "-0.03em" }}
        >
          Rooms for the{" "}
          <span style={{ color: "#E63946" }}>moment.</span>
          <br />
          <span style={{ color: "rgba(255,255,255,0.3)" }}>Gone when you leave.</span>
        </h1>

        <p className="text-lg mb-10 max-w-xl" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace", fontSize: "15px", lineHeight: 1.7 }}>
          Create or join ephemeral chat rooms in one tap. No accounts, no clutter —
          just a room ID, Username and the people you want.
        </p>

        {/* Room entry */}
        <div
          className="glow-border rounded-2xl p-6 w-full max-w-md flex flex-col"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <p className="text-left text-xs mb-2 text-gray-400 tracking-wider font-medium" style={{fontFamily: "'DM Mono', monospace" }}>
            Have a room ID? Join here.
          </p>
          
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              placeholder="ROOM-ID"
              maxLength="50"
              className="flex-1 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-400 
              border-2 border-gray-500 focus:outline-none focus:border-red-600 transition-colors"
            />
            <button
              onClick={joinRoom}
              className="btn-primary text-white font-semibold px-5 py-3 rounded-lg text-sm whitespace-nowrap"
            >
              Enter 
            </button>
          </div>

          <div className="flex gap-4 items-center mt-3 ">
            <p className="text-left text-xs text-gray-400 tracking-wider font-medium" 
            style={{ fontFamily: "'DM Mono', monospace" }}>
              Start a new room :
            </p>
          
            {createdId 
              ? (<span className="bg-gray-600 rounded-xl text-gray-400 font-semibold 
                pt-0.5 tracking-wider px-3 text-xs">
                  {createdId}
                </span>
                )
              : (<button
                  onClick={createRoom}
                  className="btn-primary text-white font-semibold px-2 py-1 rounded-lg text-xs whitespace-nowrap"
                >
                  Create room
                </button>
                )
            }
          </div>

        </div>

        <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace" }}>
          No sign-up. No trace.
        </p>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 border-t px-8 py-5 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#E63946" }}>
            <SquareDashedMousePointer size="16px"/>
          </div>

          <span className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Mono', monospace" }}>
            2026 Roomify
          </span>
        </div>

        <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Mono', monospace" }}>
            <Copyright size="12px"/>
            <span>Built by Kaushik K.S.</span>
        </div>
        
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Mono', monospace" }}>
          Built for the moment.
        </span>
      </footer>

    </div>
  );
}