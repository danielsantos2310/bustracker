let map;
let busMarkers = [];

function initMap() {
  // Center map on João Pessoa
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -7.1195, lng: -34.8450 },
    zoom: 12,
  });

  // Add mock bus markers
  addBusMarker(-7.1195, -34.8450, "Bus 001");
  addBusMarker(-7.1150, -34.8400, "Bus 002");
}

function addBusMarker(lat, lng, title) {
  const marker = new google.maps.Marker({
    position: { lat, lng },
    map,
    title,
    icon: "https://maps.google.com/mapfiles/ms/icons/bus.png",
  });
  busMarkers.push(marker);
}