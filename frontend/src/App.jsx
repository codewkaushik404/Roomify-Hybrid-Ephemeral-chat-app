import { useRef, useState, useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import ChatRoom from "./pages/ChatRoom";
import { ToastContainer } from "./components/Toast";
import {ChatProvider} from "./context/chatContext"

export default function App() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const [socketError, setSocketError] = useState("");
  const socketRef = useRef(null);

  useEffect(()=>{
      const connectWebSocket = () => {
        try {
          const ws = new WebSocket("ws://localhost:8000");
          
          ws.onopen = () => {
            setSocketReady(true);
            setSocketError("");
          };

          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setSocketError("Connection error. Please refresh the page.");
            setSocketReady(false);
          };

          ws.onclose = () => {
            setSocketReady(false);
            setSocketError("Connection closed. Attempting to reconnect...");
            // Reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
          };

          socketRef.current = ws;
        } catch (error) {
          console.error("WebSocket connection error:", error);
          setSocketError("Failed to connect. Please refresh the page.");
          setSocketReady(false);
        }
      };

      connectWebSocket();

      return () => { 
        if(socketRef.current) {
          socketRef.current.close();
        }
      }
  },[]);

  if(socketError && !socketReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-2">Connection Error</h2>
          <p className="text-white/50 mb-4">{socketError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider>
      <ToastContainer />
      {roomId 
        ? <ChatRoom roomId={roomId} username={username} onLeave={() => setRoomId("")} 
        socketRef={socketRef} socketReady={socketReady} setSocketReady={setSocketReady}/> 

        : <LandingPage setRoomId={setRoomId} socketRef={socketRef} username={username} setUsername={setUsername} 
        socketReady={socketReady} setSocketReady={setSocketReady}/> 
      }
    </ChatProvider>
  )
}
