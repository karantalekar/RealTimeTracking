// const express = require('express')
// const app = express();
// const http = require('http')
// const path = require('path')
// const socketio =require('socket.io')

// const server = http.createServer(app);

// const io = socketio(server);

// // set view engine
// app.set("view engine","ejs");
// // serve static files
// app.use(express.static(path.join(__dirname,"public")))
// // socket.io connection
// io.on("connection",function(socket){
//     socket.on("send-location",function(data){

//         io.emit("receive-location",{id:socket.id,...data})
//     });

//     socket.on("disconnect", function(){
//         io.emit("user-disconnected", socket.id)
//     })
// });

// // route
// app.get('/',(req,res)=>{
//     res.render("index")
// });

// server.listen(3000,()=>{
//     console.log("Server starts on:http://localhost:3000")
// });

const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

// store user destinations
const userDestinations = {};

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// set view engine
app.set("view engine", "ejs");
// serve static files
app.use(express.static(path.join(__dirname, "public")));

// socket.io connection
io.on("connection", function (socket) {
  console.log("New user connected:", socket.id);

  // receive destination from frontend
  socket.on("set-destination", function (destination) {
    userDestinations[socket.id] = destination;
  });

  // receive location from frontend
  socket.on("send-location", function (data) {
    const destination = userDestinations[socket.id] || null;

    // calculate distance to destination if exists
    let distance = null;
    if (destination) {
      distance = getDistanceFromLatLonInKm(
        data.latitude,
        data.longitude,
        destination.lat,
        destination.lng
      );
    }

    io.emit("receive-location", {
      id: socket.id,
      ...data,
      destination,
      distance,
    });
  });

  // handle disconnect
  socket.on("disconnect", function () {
    console.log("User disconnected:", socket.id);
    delete userDestinations[socket.id];
    io.emit("user-disconnected", socket.id);
  });
});

// route
app.get("/", (req, res) => {
  res.render("index");
});

server.listen(3000, () => {
  console.log("Server starts on: http://localhost:3000");
});
