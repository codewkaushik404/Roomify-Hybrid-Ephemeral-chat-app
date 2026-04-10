import Messages from "../models/messagesSchema.js";

export async function fetchMessages(roomId){
    const messages = await Messages.find({roomId}).sort({createdAt: 1});
    return messages;   
}

export async function createMessage(roomId, username, message){
    const messageObj = await Messages.create({roomId, username, content: message});
    return messageObj;
}

export async function deleteMessages(roomId) {
    const result = await Messages.deleteMany({roomId});
    return result;
}