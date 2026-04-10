import { WebSocket } from "ws";
import sendJson from "./sendJson";

export default function syncRoomsWithRelay(ws, input, roomId){
    if(ws.readyState !== WebSocket.OPEN) return ;

    if(input === "register_room") sendJson(ws, {type: "register_room", payload: {roomId} });
    else if(input === "delete_room") sendJson(ws, {type: "delete_room", payload: {roomId} });
}