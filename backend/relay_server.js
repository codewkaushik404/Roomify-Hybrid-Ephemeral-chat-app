import {WebSocketServer, WebSocket} from "ws";
import sendError from "./src/helper/sendError.js";
import sendJson from "./src/helper/sendJson.js";

const servers = new Map();

const wss = new WebSocketServer({port: process.env.RELAY_PORT || 8080 });
console.log("Relay server is running");

wss.on("connection", function(socket){
    servers.set(socket, new Set());
    
    socket.on("error", ()=> {
        if(socket.readyState === WebSocket.CLOSED){
            socket.terminate();
            return ;
        }
        socket.close();
    });

    socket.on("close", ()=> servers.delete(socket));

    socket.on("message", (message) =>{
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        } catch (error) {
            return sendError(socket, "Invalid message format", "error");
        }

        if(parsedMessage.type === "register_room"){
            const roomId = parsedMessage.payload?.roomId;
            if(!roomId){
                return sendError(socket, "Missing roomId in payload", "error");
            }
            let existingRooms = servers.get(socket);
            if(!existingRooms.has(roomId)) existingRooms.add(roomId);
        }

        else if(parsedMessage.type === "delete_room"){
            const roomId = parsedMessage.payload?.roomId;
            if(!roomId){
                return sendError(socket, "Missing roomId in payload", "error");
            }
            let existingRooms = servers.get(socket);
            if(existingRooms.has(roomId)) existingRooms.delete(roomId);
        }

        else if(parsedMessage.type === "relay_message"){
            const {message, roomId } = parsedMessage.payload;

            if(!message || !roomId){
                return sendError(socket, "Missing roomId or message in payload", "error");
            }

            for(const [serverSocket, roomIds] of servers){
                if(roomIds.has(roomId)) {
                    sendJson(serverSocket, {type: "message_relayed", payload: {message, roomId}});
                }
            }   
        }
    })

})