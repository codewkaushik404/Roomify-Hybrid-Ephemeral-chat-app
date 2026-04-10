import {config} from "dotenv";
config({quiet: true});
import express from "express";
import http from "http";
import dbConnection from "./src/config/db.js";
import {createWebSocketServer} from "./src/ws/server.js";

const app = express();
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res)=> {
    res.send("Server is healthy");
})

createWebSocketServer(server);

(async function (){
    try{
        await dbConnection();
        server.listen(PORT, ()=> console.log("Server is running on PORT:", PORT))
    }catch(err){
        console.error(err);
        process.exit(1);
    }
})();

