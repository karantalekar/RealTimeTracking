const socket = io(); // connect to backend

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      // send location to backend
      socket.emit("send-location", { latitude, longitude });
    },
    (error) => {
      console.error(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}

// setup map
const map = L.map("map").setView([0, 0], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Karan Talekar",
}).addTo(map);

// store all markers
const markers = {};

// listen for locations from backend
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  map.setView([latitude, longitude], 16);

  if (markers[id]) {
    // update marker position
    markers[id].setLatLng([latitude, longitude]);
  } else {
    // create new marker
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
});


socket.on("user-disconnected",(id)=>{
    if(markers[id]){
        map.removeLayer(markers[id]);
        delete markers[id];
    }
})