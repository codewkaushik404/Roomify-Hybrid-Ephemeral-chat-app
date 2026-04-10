import generateUniqueRoomIds from "../utils/uniqueRoomId.js";
import { isValidRoom, isValidUser } from "../helper/isValid.js";
import sendError from "../helper/sendError.js";
import sendJson from "../helper/sendJson.js";
import { createMessage, deleteMessages, fetchMessages } from "../services/messages.js";
import syncRoomsWithRelay from "../helper/syncRooms.js";

export const rooms = new Map();
export let relaySocket = null;

export async function initializeRelaySocket(createWebSocketClient) {
    try {
        relaySocket = await createWebSocketClient();
    } catch(err) {
        console.log("Connection as client to relay_server failed");
        process.exit(1);
    }
}

//payload : {username} 
// relay-payload: {roomId}
export function createRoom(socket, message){
    
    if (!message.payload || !message.payload.username) {
        sendError(socket, "Username is required", "error");
        return;
    }

    const username = message.payload.username;
    const roomId = generateUniqueRoomIds(rooms);
    rooms.set(roomId, {
        users: new Map(),
        owner: {username, socket},
        createdAt: new Date(),
        setting: {private: false}
    })

    syncRoomsWithRelay(relaySocket, "register_room", roomId);
    sendJson(socket, {type: "room_created", payload: {roomId} })
}

//payload: {roomId, username}
export function joinRoom(socket, message){
    const {roomId, username} = message.payload;

    if(!roomId || !username){
        sendError(socket, "Bad request", "error");
        return ;
    }

    if(!isValidRoom(rooms, roomId)){
        sendError(socket, "Invalid Room ID.", "error");
        return ;
    }

    const room = rooms.get(roomId);
    if(room.owner.username === username){
        room.owner.socket = socket; // Update socket reference on reconnect
        room.users.set(username, socket);
    }

    //if user
    else {
        if(room.users.has(username)){
            sendError(socket, "Username already exists", "warn");
            return ;
        }
        else  room.users.set(username, socket);
    }        

    sendJson(socket, {type: "room_joined", payload: {roomId }});

    fetchMessages(roomId)
    .then((messages) => {
        if(messages.length > 0){
            sendJson(socket, {type: "old_messages", payload: {messages}} );
        }
    })
    .catch((err) => {
        sendError(socket, err.message || "Error while fetching messages", "error");
    });
}

//payload -> {roomId, username, message}
export function sendMessage(socket, wsMessage){
    const {username, roomId, message} = wsMessage.payload;

    if(!message || typeof message !== 'string' || message.trim() === ''){
        sendError(socket, "Message content is required", "error");
        return;
    }

    if(!isValidRoom(rooms, roomId)){
        sendError(socket, "Invalid Room ID.", "error");
        return ;
    }
    
    if(!isValidUser(rooms, roomId, username)){
        sendError(socket, "User doesn't belong to this room", "error");
        return ;
    }

    createMessage(roomId, username, message)
    .then((messageObj) => {
        sendJson(relaySocket, {type: "relay_message", payload: {message: messageObj, roomId }} );
    }) 
    .catch ((err)=>{
        sendError(socket, "Failed to send message", "error");
    })
}

//payload -> {roomId, username}
// relay-payload: {roomId}
export function leaveRoom(socket, message){
    const {roomId, username} = message.payload;
        
    if(!isValidRoom(rooms, roomId)){
        sendError(socket, "Invalid Room ID.", "error");
        return ;
    }
    
    if(!isValidUser(rooms, roomId, username)){
        sendError(socket, "User doesn't belong to this room", "error");
        return ;
    }

    const room = rooms.get(roomId);
    if(room.owner.socket === socket && room.owner.username === username){

        deleteMessages(roomId)
        .then((deletedMessages) => {
            if(deletedMessages){
                rooms.delete(roomId);
                syncRoomsWithRelay(relaySocket, "delete_room", roomId);
                sendJson(socket, {type: "room_left" });
            }

            else sendError(socket, "Failed to delete room", "error");
        })
        .catch((err) => {
            sendError(socket, "Error while deleting messages", "error");
        })
        return ;
    }

    room.users.delete(username);
    sendJson(socket, {type: "room_left" })
}