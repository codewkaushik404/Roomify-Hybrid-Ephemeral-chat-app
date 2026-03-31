import mongoose from "mongoose";

export default async function dbConnection(){
    try{
        const db = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to DB: ${db.connection.name} successfully`)
    }catch(err){
        console.log("Mongo DB connection failed", err.message);
        process.exit(1);
    }
}