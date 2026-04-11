import {WebSocketServer, WebSocket} from "ws";
import sendError from "../helper/sendError.js";
import sendJson from "../helper/sendJson.js";
import { createRoom, sendMessage, joinRoom, leaveRoom, rooms, relaySocket } from "../services/room.js";
import { deleteMessages } from "../services/messages.js";
import syncRoomsWithRelay from "../helper/syncRooms.js";

function handleMessage(socket, message){
    
    if(message.type === "create_room"){
        createRoom(socket, message);
    }

    else if(message.type === "join_room"){
        joinRoom(socket, message);
    }

    else if(message.type === "send_message"){
        sendMessage(socket, message);
    }

    else if(message.type === "leave_room"){
        leaveRoom(socket, message);
    }
}

export default function createWebSocketServer(server){
    const wss = new WebSocketServer({server, path: "/ws", maxPayload:  1024*1024});

    wss.on("connection", function(socket, request){
        
        socket.on("error", (err)=>{
            console.error("Socket error", err.message);

            if(socket.readyState === WebSocket.CLOSED) socket.terminate();
            else socket.close();
        })

        socket.on("message", async function(message){
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(message);
            } catch (error) {
                return sendError(socket, "Invalid message format", "error");
            }

            handleMessage(socket, parsedMessage);
        })

        socket.on("close", async () => {
            for(const key of rooms.keys()){
                const room = rooms.get(key);
                
                if(room.owner.socket === socket){
                    // Notify all remaining users that room is ending
                    for(const [username, userSocket] of room.users){
                        sendJson(userSocket, {type: "room_ended" });
                    }
                    
                    try{
                        await deleteMessages(key);
                    }catch(err){
                        console.error("Error while deleting messages", err.message);
                    }
                    rooms.delete(key);
                    syncRoomsWithRelay(relaySocket, "delete_room", key);    
                }
                
                else {
                    for( const [username, userSocket] of room.users){
                        if(userSocket === socket){
                            // Notify other users that someone left
                            room.users.delete(username);
                            for(const [username, socket] of room.users){
                                sendJson(socket, {type: "room_left"})
                            }
                            break;
                        }
                    }
                }
            }
        })  
    })
}




