import { WebSocket } from "ws";
import sendJson from "../helper/sendJson.js";

export default function createWebSocketClient(rooms){
    const ws = new WebSocket(process.env.RELAY_URL);

    return new Promise((resolve, reject) => {
        ws.onopen = ()=> {
            console.log("Connected to relay server");

            ws.onmessage = ({data})=>{
                let parsedMessage;
                try {
                    parsedMessage = JSON.parse(data);
                } catch (error) {
                    console.error("JSON parse error:", error);
                    return ;
                }

                if(parsedMessage.type === "message_relayed"){
                    const {message, roomId, username} = parsedMessage.payload;
                    const existingUsers = rooms.get(roomId)?.users;
                    if(existingUsers && existingUsers.size > 0){
                        for(const [user, userSocket] of existingUsers){
                            sendJson(userSocket, {type: "new_message", payload: { message, roomId, username}});
                        }
                    }
                }
            }
            resolve(ws);

        }
        ws.onerror = (err)=> reject(err);
    })
}