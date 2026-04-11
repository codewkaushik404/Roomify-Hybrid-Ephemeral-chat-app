import {atom, selector} from "recoil";
import { usernameAtom } from "./usernameAtom";

export const messagesAtom = atom({
    key: "messagesAtom",
    default: []
})

// id, self sender text time 
export const formattedMessages = selector({
    key: "formattedMessages",
    get: ({get}) =>{
        let messages = get(messagesAtom);
        const senderUsername = get(usernameAtom);
        messages = messages.map((msg) => {
            const date = new Date(msg.createdAt);
            const timeStr = date.toLocaleTimeString([], {
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })
            return {
                id: msg._id,
                self: senderUsername === msg.username,
                sender: msg.username,
                text: msg.content,
                time: timeStr,
                fullDate: date,
                dateString: date.toDateString()
            }
            
        })

        return messages;
    }
})

