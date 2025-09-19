const express = require('express')
const app = express();
const http = require('http')
const path = require('path')
const socketio =require('socket.io')

const server = http.createServer(app);

const io = socketio(server);


// set view engine
app.set("view engine","ejs");
// serve static files
app.use(express.static(path.join(__dirname,"public")))
// socket.io connection
io.on("connection",function(socket){
    socket.on("send-location",function(data){
        io.emit("receive-location",{id:socket.id,...data})
    });
    
    socket.on("disconnect", function(){
        io.emit("user-disconnected", socket.id)
    })
});


// route
app.get('/',(req,res)=>{
    res.render("index")
});


server.listen(3000,()=>{
    console.log("Server starts on:http://localhost:3000")
});

