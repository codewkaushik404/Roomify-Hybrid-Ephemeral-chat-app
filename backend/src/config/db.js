import mongoose from "mongoose";

export default async function dbConnection(){
    try{
        const db = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Connected to DB: ${db.connection.name} successfully`)
        return db;
    }catch(err){
        throw new Error(`MongoDB connection failed: ${err.message}`, { cause: err });
    }
}