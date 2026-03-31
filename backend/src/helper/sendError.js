
export default function sendError(socket, message, type){
    const validErrors = ["warn", "error"];
    if(message && validErrors.includes(type)){
        socket.send(JSON.stringify({type: "error", payload: {message, type}}));
    }
}