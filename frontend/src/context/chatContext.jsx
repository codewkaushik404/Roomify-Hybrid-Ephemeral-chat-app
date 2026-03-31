import {useContext, createContext, useState} from "react";

const ChatContext = createContext();

export function ChatProvider({children}){

    const [messages, setMessages] = useState([]);

    function addMessages(newMessages, currentUsername){
        const formatted = newMessages.map((m) => ({
            id: m._id,
            roomId: m.roomId,
            sender: m.username,
            self: m.username === currentUsername,
            text: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }))
        setMessages((prev) => [...prev, ...formatted]);
    }

    function clearMessages(){
        setMessages([]);
    }

    return (
        <ChatContext.Provider value={{messages, addMessages, clearMessages}}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChat = () => useContext(ChatContext);
