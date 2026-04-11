import generateUniqueRoomIds from "../utils/uniqueRoomId.js";
import { isValidRoom, isValidUser } from "../helper/isValid.js";
import sendError from "../helper/sendError.js";
import sendJson from "../helper/sendJson.js";
import { createMessage, deleteMessages, fetchMessages } from "../services/messages.js";
import syncRoomsWithRelay from "../helper/syncRooms.js";

export const rooms = new Map();
export let relaySocket = null;

export async function initializeRelaySocket(createFn) {
    try {
        relaySocket = await createFn();
    } catch(err) {
        console.log("Connection as client to relay_server failed");
        process.exit(1);
    }
}

function broadcast(roomId, payload){
    if(!rooms.has(roomId)) return ;

    const room = rooms.get(roomId);
    for(const [username, socket] of room.users){
        sendJson(socket, payload);
    }
}

//payload : {username} 
// relay-payload: {roomId}
export function createRoom(socket, message){
    const roomId = generateUniqueRoomIds(rooms);
    rooms.set(roomId, {
        users: new Map(),
        owner: {socket},
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
    if(room.owner.socket === socket){
        room.owner.username = username
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
    
    const existingUsers = Array.from(room.users.keys());
    sendJson(socket, {type: "room_joined", payload: {roomId, username, existingUsers }});
    // Broadcast to other users only
    for(const [user, userSocket] of room.users){
        if(userSocket !== socket){
            sendJson(userSocket, {type: "new_joinee", payload: {existingUsers}});
        }
    }
    
    fetchMessages(roomId)
    .then((messages) => {
        if(messages.length > 0){
            sendJson(socket, {type: "old_messages", payload: {messages, username}} );
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
        sendJson(relaySocket, {type: "relay_message", payload: {message: messageObj, roomId, username }} );
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
                broadcast(roomId, {type: "room_ended"});
                syncRoomsWithRelay(relaySocket, "delete_room", roomId);
                rooms.delete(roomId);
            }

            else sendError(socket, "Failed to delete room", "error");
        })
        .catch((err) => {
            sendError(socket, "Error while deleting messages", "error");
        })
        return ;
    }
    
    else {
        room.users.delete(username);
        sendJson(socket, {type: "room_left"});
        broadcast(roomId, {type: "room_users", payload: {existingUsers: Array.from(room.users.keys()) }});
    }
}