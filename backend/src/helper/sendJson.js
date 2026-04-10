import { WebSocket } from "ws"

export default function sendJson(socket, message){
    if(!socket || socket.readyState !== WebSocket.OPEN) return ;
    socket.send(JSON.stringify(message));
} 