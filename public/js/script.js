// const socket = io(); // connect to backend

// if (navigator.geolocation) {
//   navigator.geolocation.watchPosition(
//     (position) => {
//       const { latitude, longitude } = position.coords;
//       // send location to backend
//       socket.emit("send-location", { latitude, longitude });
//     },
//     (error) => {
//       console.error(error);
//     },
//     {
//       enableHighAccuracy: true,
//       timeout: 5000,
//       maximumAge: 0,
//     }
//   );
// }

// // setup map
// const map = L.map("map").setView([0, 0], 10);

// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution: "Karan Talekar",
// }).addTo(map);

// // store all markers
// const markers = {};

// // listen for locations from backend
// socket.on("receive-location", (data) => {
//   const { id, latitude, longitude } = data;

//   map.setView([latitude, longitude], 16);

//   if (markers[id]) {
//     // update marker position
//     markers[id].setLatLng([latitude, longitude]);
//   } else {
//     // create new marker
//     markers[id] = L.marker([latitude, longitude]).addTo(map);
//   }
// });

// socket.on("user-disconnected",(id)=>{
//     if(markers[id]){
//         map.removeLayer(markers[id]);
//         delete markers[id];
//     }
// })
const socket = io(); // connect to backend

const map = L.map("map").setView([0, 0], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Karan Talekar",
}).addTo(map);

let currentMarker = null; // marker for current location
let sourceMarker = null;
let destinationMarker = null;
let routeControl = null;

const distanceDisplay = document.getElementById("distance");
let currentLocation = null;

// Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Geocode text to coordinates
async function geocode(location) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Watch user's current location
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      currentLocation = { lat: latitude, lng: longitude };

      // Show current location marker
      if (!currentMarker) {
        currentMarker = L.marker(currentLocation)
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();
        map.setView(currentLocation, 16);
      } else {
        currentMarker.setLatLng(currentLocation);
      }

      socket.emit("send-location", currentLocation);
    },
    (error) => console.error(error),
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

// Set route button click
document.getElementById("setRouteBtn").addEventListener("click", async () => {
  const sourceText = document.getElementById("sourceInput").value;
  const destText = document.getElementById("destinationInput").value;

  if (!destText && !sourceText)
    return alert("Please enter at least destination!");

  // Determine source
  let sourceCoords = currentLocation; // default to current location
  if (sourceText) {
    const src = await geocode(sourceText);
    if (!src) return alert("Source location not found!");
    sourceCoords = src;
  } else if (!currentLocation) {
    return alert(
      "Current location not available. Allow location access or enter source."
    );
  }

  // Determine destination
  const destCoords = await geocode(destText);
  if (!destCoords) return alert("Destination location not found!");

  // Update markers
  if (sourceMarker) map.removeLayer(sourceMarker);
  if (destinationMarker) map.removeLayer(destinationMarker);

  sourceMarker = L.marker([sourceCoords.lat, sourceCoords.lng])
    .addTo(map)
    .bindPopup("Source")
    .openPopup();
  destinationMarker = L.marker([destCoords.lat, destCoords.lng])
    .addTo(map)
    .bindPopup("Destination")
    .openPopup();

  // Fit map bounds
  map.fitBounds([
    [sourceCoords.lat, sourceCoords.lng],
    [destCoords.lat, destCoords.lng],
  ]);

  // Remove previous route
  if (routeControl) map.removeControl(routeControl);

  // Draw route
  routeControl = L.Routing.control({
    waypoints: [
      L.latLng(sourceCoords.lat, sourceCoords.lng),
      L.latLng(destCoords.lat, destCoords.lng),
    ],
    lineOptions: { styles: [{ color: "blue", opacity: 0.6, weight: 4 }] },
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
  }).addTo(map);

  // Calculate distance
  const distanceKm = getDistanceFromLatLonInKm(
    sourceCoords.lat,
    sourceCoords.lng,
    destCoords.lat,
    destCoords.lng
  );
  distanceDisplay.innerText = "Distance: " + distanceKm.toFixed(2) + " km";

  // Send destination to backend
  socket.emit("set-destination", destCoords);
  socket.emit("send-location", sourceCoords);
});
