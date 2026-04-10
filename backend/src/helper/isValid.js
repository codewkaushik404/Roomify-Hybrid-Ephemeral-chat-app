import sendError from "./sendError.js";

export function isValidRoom(rooms, roomId){
    if(!rooms.has(roomId)) return false;
    return true;
}

export function isValidUser(rooms, roomId, username){
    const room = rooms.get(roomId);
    if(!room || !room.users.has(username)) return false;
    return true;
}