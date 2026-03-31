import mongoose from "mongoose";

const messagesSchema = mongoose.Schema({
    roomId: {type: String, required: true},
    username: {type: String, required: true},
    content: {type: String, required: true},
    
}, {timestamps: true});

export default mongoose.model("Messages", messagesSchema);