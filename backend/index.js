import {config} from "dotenv";
config({quiet: true});
import {WebSocketServer, WebSocket} from "ws";
import dbConnection from "./src/config/db.js";
import generateUniqueRoomIds from "./src/utils/uniqueRoomId.js"
import Messages from "./src/models/messagesSchema.js";
import { isValidRoom, isValidUser } from "./src/helper/isValid.js";
import sendError from "./src/helper/sendError.js";

await dbConnection();
const wss = new WebSocketServer({port: process.env.WS_SERVER_PORT || 8000});
console.log("WebSocket Server is running");

const ws = new WebSocket(process.env.BACKEND_URL_RELAY);
await new Promise((resolve, reject) => {
    ws.onopen = ()=>{
        resolve();
    }
    ws.onerror = (err)=> reject(err.message);
}).catch((err) => {
    console.error("Couldn't connect to relay server",err);
    process.exit(1);
})

function syncRoomsWithRelay(input, roomId){
    if(ws.readyState !== WebSocket.OPEN) return ;

    if(input === "register_room"){
        ws.send(JSON.stringify({type: "register_room", payload: {roomId} }));
    }
    else if(input === "delete_room"){
        ws.send(JSON.stringify({type: "delete_room", payload: {roomId} }));
    }
}

ws.onmessage = (event)=>{
    let parsedMessage;
    try {
        parsedMessage = JSON.parse(event.data);
    } catch (error) {
        console.error("JSON parse error:", error);
        return ;
    }

    if(parsedMessage.type === "relay_message"){
        const {message, roomId} = parsedMessage.payload;
        rooms[roomId].users.forEach((obj) => {
        //checking if the users in the room have active connection or not and sending messages only to active ones
            if(obj.socket?.readyState === WebSocket.OPEN) {
                obj.socket.send(JSON.stringify({type: "new_message", payload: { message }}));
            }
        });
    }
}

const rooms = {};

wss.on("connection", function(socket){
    
    socket.on("message", async function(message){
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        } catch (error) {
            return sendError(socket, "Invalid message format", "error");
        }

        if(parsedMessage.type === "create_room"){
            const roomId = generateUniqueRoomIds(rooms);
            rooms[roomId] = {
                users: [{socket}],
                owner: {socket},
                createdAt: new Date().toISOString(),
                setting: {private: false}
            }
            syncRoomsWithRelay("register_room", roomId);
            socket.send(JSON.stringify({type: "room_created", payload: {roomId} }));
        }

        else if(parsedMessage.type === "join_room"){
            const {roomId, username} = parsedMessage.payload;

            if(!isValidRoom(socket, rooms, roomId)) return ;

            else if(rooms[roomId].owner.socket === socket){
                rooms[roomId].owner = {username, socket};
            }

            else if(!rooms[roomId].owner.username){
                sendError(socket, "Cannot join room. Owner hasn't joined yet", "warn");
                return ;
            }

            const exists = rooms[roomId].users?.some((user) => user.username === username);

            if(exists){
                sendError(socket, "Username is already taken", "warn");
                return ;
            }

            rooms[roomId].users.push({username, socket});
            
            try {
                const messages = await Messages.find({roomId}).sort({createdAt: 1});
                if(messages.length > 0){
                    socket.send(JSON.stringify({type: "old_messages", payload: {messages}}));
                }
                socket.send(JSON.stringify({type: "room_joined", payload: {roomId}}));
            } catch (error) {
                sendError(socket, "Failed to join room", "error");
            }
        }

        else if(parsedMessage.type === "send_message"){
            const {username, roomId, message} = parsedMessage.payload;

            if(!isValidRoom(socket, rooms, roomId) || !isValidUser(socket, rooms, roomId)) return ;
            
            try {
                const messageObj = await Messages.create({roomId, username, content: message});
                ws.send(JSON.stringify({type: "forward_message", payload: {message: messageObj, roomId }}));
            } catch (error) {
                sendError(socket, "Failed to send message", "error");
            }
        }

        else if(parsedMessage.type === "leave_room"){
            const {roomId, username} = parsedMessage.payload;
            
            if(!isValidRoom(socket, rooms, roomId) || !isValidUser(socket, rooms, roomId)) return ;

            const room = rooms[roomId];
            if(room.owner.socket === socket && room.owner.username === username){
                try {
                    await Messages.deleteMany({roomId});
                    delete rooms[roomId];
                    syncRoomsWithRelay("delete_room", roomId);
                } catch (error) {
                    sendError(socket, "Failed to leave room", "error");
                }
            } else {
                room.users = room.users.filter((obj) => obj.socket !== socket);
            }
            if(socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({type: "left_room"}));
            }
        }
    })

    socket.on("close", async () => {
        for(const roomId in rooms){
            const room = rooms[roomId];

            if(room.owner.socket === socket){
                await Messages.deleteMany({roomId});
                delete rooms[roomId];
                syncRoomsWithRelay("delete_room", roomId);
                break;
            }
            room.users = room.users.filter((user) => user.socket !== socket);
        }
    })
    
})