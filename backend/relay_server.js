import {WebSocketServer, WebSocket} from "ws";
import sendError from "./src/helper/sendError.js";
const wss = new WebSocketServer({port: process.env.RELAY_WS_SERVER_PORT || 8080 });
console.log("Relay Server is running");

const servers = new Map();

wss.on("connection", function(socket){
    servers.set(socket, new Set());
    
    socket.on("message", (message) =>{
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        } catch (error) {
            return sendError(socket, "Invalid message format", "error");
        }

        if(parsedMessage.type === "register_room"){
            const roomId = parsedMessage.payload.roomId;
            servers.get(socket).add(roomId);
        }

        else if(parsedMessage.type === "delete_room"){
            const roomId = parsedMessage.payload.roomId;
            servers.get(socket).delete(roomId);
        }

        else if(parsedMessage.type === "forward_message"){
            const {message, roomId } = parsedMessage.payload;
            servers.forEach((roomIds, serverSocket) => {
                if(serverSocket.readyState !== WebSocket.OPEN || !roomIds.has(roomId)) return;
                serverSocket.send(JSON.stringify({type: "relay_message", payload: {message, roomId}}));
            })    
        }
    })

    socket.on("close", ()=> servers.delete(socket));
})