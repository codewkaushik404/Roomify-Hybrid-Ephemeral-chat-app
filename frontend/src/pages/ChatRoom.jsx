
import React, { useState, useRef, useEffect} from "react";
import Avatar from "../components/ui/Avatar";
import {SquareDashedMousePointer, LogOut} from "lucide-react"
import Toast from "../components/Toast";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { usernameAtom } from "../store/atoms/usernameAtom";
import { existingUsersAtom } from "../store/atoms/existingUsersAtom";
import { formattedMessages, messagesAtom } from "../store/atoms/messagesAtom";

export default function ChatRoom({roomId, onLeave, socketRef, socketReady }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const username = useRecoilValue(usernameAtom);
  const [existingUsers, setExistingUsers] = useRecoilState(existingUsersAtom);
  const setMessages = useSetRecoilState(messagesAtom);
  const formatted_messages = useRecoilValue(formattedMessages);
  const roomEndedTimeoutRef = useRef(null);

  function handleLeave(){
    if(!socketReady) return ;
    const socket = socketRef.current;
    socket.send(JSON.stringify({type: "leave_room", payload: {roomId, username}}));
  }

  function handleClose(){
    setExistingUsers((prev) => prev.filter(u => u !== username));
    setMessages([]);
    onLeave();
  }

  useEffect(() => {
    if(!socketReady) return ;

    const socket = socketRef.current;

    function handleMessage(event){
        const parsedMessage = JSON.parse(event.data);
        if(parsedMessage.type === "new_message"){
            const {message } = parsedMessage.payload;
            message && Object.keys(message).length > 0 && setMessages((prev) => [...prev, message]);
        }

        else if(parsedMessage.type === "new_joinee"){
          const {existingUsers: currentUsers} = parsedMessage.payload;
          setExistingUsers(currentUsers);
        }
        
        else if(parsedMessage.type === "room_ended"){
            Toast("Admin ended the room", "warn");
            roomEndedTimeoutRef.current = setTimeout(() => handleClose(), 1500);
        }
        
        else if(parsedMessage.type === "room_left"){
          handleClose();
        }

        else if(parsedMessage.type === "room_users"){
          const { existingUsers: currentUsers} = parsedMessage.payload;
          setExistingUsers(currentUsers);
        }

        else if(parsedMessage.type === "error"){
            const {message, type} = parsedMessage.payload;
            message && Toast(message, type);
        }
    }

    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose)
    
    return () => { 
        socket.removeEventListener("message", handleMessage)
        socket.removeEventListener("close", handleClose);

        if (roomEndedTimeoutRef.current) clearTimeout(roomEndedTimeoutRef.current);
    }

  }, [socketReady, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [formatted_messages]); 

  const sendMessage = () => {
    if(!socketReady) return ;
    const trimmedInput = input.trim();
    if(!trimmedInput) {
      Toast("Message cannot be empty", "warn");
      return;
    }
    
    if(trimmedInput.length > 500) {
      Toast("Message must be 500 characters or less", "warn");
      return;
    }

    const socket = socketRef.current;
    socket.send(JSON.stringify({type: "send_message", payload: { username, roomId, message: trimmedInput}}));
    setInput("");
  };

  function formatDateLabel(dateRaw) {
    const today = new Date();

    if (dateRaw.toDateString() === today.toDateString()) {
      return "Today";
    }

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateRaw.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return dateRaw.toDateString();
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", fontFamily: "'Syne', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #E63946; color: #fff; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .chat-input:focus { outline: none; border-color: rgba(230,57,70,0.6) !important; box-shadow: 0 0 0 3px rgba(230,57,70,0.1); }
        .send-btn { background: #E63946; transition: all 0.2s; }
        .send-btn:hover { background: #ff4757; box-shadow: 0 0 20px rgba(230,57,70,0.35); }
        .send-btn:active { transform: scale(0.97); }
        .logout-btn { background: rgba(230,57,70,0.12); border: 1px solid rgba(230,57,70,0.35); color: #E63946; transition: all 0.2s; }
        .logout-btn:hover { background: rgba(230,57,70,0.22); }
        .msg-in { animation: msgIn 0.3s ease forwards; opacity: 0; }
        @keyframes msgIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .typing-dot { animation: blink 1.2s infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
        .online-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(42,157,143,0.6); } 50% { box-shadow: 0 0 0 4px rgba(42,157,143,0); } }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}
      </style>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#E63946" }}>
            <SquareDashedMousePointer size="20px"/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Roomify</span>
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>/</span>
              <span style={{ color: "#E63946", fontSize: "12px", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                {roomId}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div
                className="online-dot w-1.5 h-1.5 rounded-full"
                style={{ background: "#2A9D8F" }}
              />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
                {existingUsers?.length || 0} members online 
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Avatars */}
          <div className="hidden sm:flex items-center -space-x-1.5">
            {(existingUsers || []).map((sender) => (
              <div key={sender} className="ring-2 rounded-full" style={{ ringColor: "#0a0a0a" }}>
                <Avatar name={sender} size={7} />
              </div>
            ))}
          </div>
          <button
            onClick={handleLeave}
            className="logout-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px" }}
          >
            <LogOut size="18px" />
            <span>Leave Room</span> 
          </button>
        </div>
      </div>

      {/* Messages area */}
        <div className="flex-1 overflow-y-auto relative grid-bg">
            <div className="flex flex-col gap-1 px-4 py-6 max-w-3xl mx-auto w-full">
                {formatted_messages.map((m, i, arr) => {
                    const showAvatar = !m.self && (i === 0 || arr[i - 1].sender !== m.sender);
                    const currDate = m.dateString;
                    const prevDate = i > 0 ? arr[i - 1].dateString : null;
                    const showDateChip = i === 0 || currDate !== prevDate;
                    
                    const dateChip = formatDateLabel(m.fullDate);
                    return (
                        <React.Fragment key={m.id}>
                        {showDateChip && (
                            <div className="flex items-center justify-center my-2">
                            <div
                                className="px-3 py-1 rounded-full text-xs"
                                style={{
                                background: "rgba(255,255,255,0.05)",
                                color: "rgba(255,255,255,0.25)",
                                fontFamily: "'DM Mono', monospace",
                                }}
                            >
                                {dateChip}
                            </div>
                            </div>
                        )}  

                        <div
                            className={`flex items-end gap-2 msg-in ${m.self ? "flex-row-reverse" : ""}`}
                            style={{ marginBottom: "2px" }}
                        >
                            {!m.self ? (
                            showAvatar ? <Avatar name={m.sender} size={7} /> : <div style={{ width: 28 }} />
                            ) : null}

                            <div className={`flex flex-col max-w-sm ${m.self ? "items-end" : "items-start"}`}>
                            {showAvatar && !m.self && (
                                <span
                                className="text-xs mb-1 ml-1"
                                style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}
                                >
                                {m.sender}
                                </span>
                            )}
                            <div
                                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                                style={{
                                background: m.self
                                    ? "linear-gradient(135deg,#E63946,#c1121f)"
                                    : "rgba(255,255,255,0.07)",
                                color: "rgba(255,255,255,0.9)",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "13px",
                                borderTopRightRadius: m.self ? "4px" : "18px",
                                borderTopLeftRadius: m.self ? "18px" : "4px",
                                }}
                            >
                                {m.text}
                            </div>
                            <span
                                className="text-xs mt-1 px-1"
                                style={{ color: "rgba(255,255,255,0.18)", fontFamily: "'DM Mono', monospace" }}
                            >
                                {m.time}
                            </span>
                            </div>
                        </div>
                        </React.Fragment>
                    );    
                })}

                <div ref={bottomRef} />
            </div>
        </div>

      {/* Input bar */}
      <div
        className="flex-shrink-0 px-4 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(10,10,10,0.98)" }}
      >
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message…"
            maxLength="500"
            className="chat-input flex-1 bg-transparent rounded-xl px-4 py-3 text-white text-sm border"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "13px",
              background: "rgba(255,255,255,0.04)",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="send-btn text-white font-semibold px-5 py-3 rounded-xl text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span>Send</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-xs mt-2 max-w-3xl mx-auto">
          <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace" }}>
            Press Enter to send 
          </p>
          <p style={{ color: input.length > 450 ? "#E63946" : "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
            {input.length}/500
          </p>
        </div>
      </div>
    </div>
  );
}
