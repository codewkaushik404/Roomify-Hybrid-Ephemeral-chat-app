import sendError from "./sendError.js";

export function isValidRoom(socket, rooms, roomId){
    if(!rooms[roomId]){
        sendError(socket, "Invalid Room ID.", "error");
        return false;
    }
    return true;
}

export function isValidUser(socket, rooms, roomId){
    if(!rooms[roomId].users.some((obj) => obj.socket === socket)){
        sendError(socket, "User doesn't belong to this room.", "error");
        return false;
    }
    return true;
}