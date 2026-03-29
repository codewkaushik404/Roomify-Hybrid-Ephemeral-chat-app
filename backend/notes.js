import { WebSocketServer } from "ws";

const wss = new WebSocketServer({port: 8000});

wss.on("connection", function(socket){
    console.log("user connected");

    //PING - PONG
    socket.on("message", function(e){
        //if u dont do .toString() u will get some numerical buffer data
        //if u want exact input u do .toString()
        if(e.toString() === "ping"){
            socket.send("pong");
        }
         
    })

    setInterval(()=>{
        //socker.send(arg1, arg2) => it takes only 1 argument arg2 will be ignored
        socket.send(`Current REL Price: ${Math.random()*100}`);
    },1000);
})

//1008 for policy-violation 
// use it to send errors but connection will close or use socket.send() for errors