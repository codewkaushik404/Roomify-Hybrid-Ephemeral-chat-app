import {WebSocketServer, WebSocket} from "ws";
import generateUniqueRoomIds from "./src/utils/uniqueRoomId.js"

const wss = new WebSocketServer({port: 8000});
console.log("Server is running");

let allSockets = [];
const rooms = {};

wss.on("connection", function(socket){
    
    socket.on("message", function(message){
        console.log("message arrived");
        const parsedMessage = JSON.parse(message);

        if(parsedMessage.type === "create_room"){
            const roomId = generateUniqueRoomIds(rooms);
            rooms[roomId] = {
                users: [socket],
                owner: socket,
                createdAt: new Date().toDateString(),
                setting: {private: false}
            }
            socket.send(JSON.stringify({type: "room_created", payload: {roomId} }));
        }

        else if(parsedMessage.type === "join_room"){
            const roomId = parsedMessage.payload.roomId;
            if(!rooms[roomId]){
                socket.send(JSON.stringify({type: "error", payload: {message: "Invalid ID. No room found"}}));
                return ;
            }
            rooms[roomId].users.push(socket);
            socket.send(JSON.stringify({type: "room_joined", payload: {roomId}}));
        }
    })

    socket.on("close", (code, reason) => {
        console.log("Connection disconnected");
    })
})