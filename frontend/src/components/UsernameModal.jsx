import { useEffect, useState } from "react";
import Toast from "./Toast";

export default function UsernameModal({ setRoomId, setUsername, setOpen, usernameRef, inputRef, socketRef}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
     const socket = socketRef.current;
     if(!socket) return ;

     function handleMessage(event){
      const parsedMessage = JSON.parse(event.data);

      if(parsedMessage.type === "room_joined"){
        setRoomId(parsedMessage.payload?.roomId);
        setUsername(usernameRef.current.value.trim());
        setOpen(false);
        setIsLoading(false);
        setError("");
      }

      else if(parsedMessage.type === "error"){
        const {message, type} = parsedMessage.payload;
        if(message){
          setError(message);
          Toast(message, type);
        }
        setIsLoading(false);
      }
     }

     function handleClose(){
      setRoomId("");
      setUsername("");
      socketRef.current = null;
      setOpen(false);
      setIsLoading(false);
     }

     socket.addEventListener("message", handleMessage);
     socket.addEventListener("close", handleClose);
     
     return () => { 
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose); 
    };
  }, [socketRef, setRoomId, setUsername, setOpen]);

  function handleSubmit(){
    const socket = socketRef.current;
    const roomId = inputRef.current.value.trim();
    const username = usernameRef.current.value.trim();

    // Validation
    if(!socket) {
      setError("Socket not connected");
      return Toast("Socket not connected", "error");
    }
    if(!roomId) {
      setError("Room ID is required");
      return Toast("Room ID is required", "warn");
    }
    if(!username) {
      setError("Username is required");
      return Toast("Username is required", "warn");
    }
    if(username.length > 20) {
      setError("Username must be 20 characters or less");
      return Toast("Username must be 20 characters or less", "warn");
    }

    setIsLoading(true);
    setError("");
    socket.send(JSON.stringify({type: "join_room", payload: {roomId, username}}));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60">
      <div className="bg-black border border-white/10 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-5">
        <div>
          <h2 className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Who are you?
          </h2>
          <p className="text-white/30 text-xs mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
            Pick a name before entering the room.
          </p>
        </div>

        <input
          autoFocus
          type="text"
          ref={usernameRef}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSubmit()}
          placeholder="Enter your name...."
          disabled={isLoading}
          className="bg-white/5 border border-white/10 focus:border-red-600 focus:outline-none rounded-lg px-4 py-3 text-white text-sm placeholder-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "'DM Mono', monospace" }}
          maxLength="20"
        />

        {error && (
          <p className="text-red-500 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {isLoading ? "Joining..." : "Enter Room"}
        </button>

      </div>
    </div>
  );
}