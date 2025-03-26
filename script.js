// Main variables
let map;
let busMarkers = [];
let routePolylines = [];
let selectedDirection = 'northbound';
let busInterval;
let infoWindows = [];

// Route configuration
const jpBusRoutes = {
    "527": {
        name: "527 - UFPB ↔ Epitácio ↔ Integração",
        color: "#FF6600",
        directions: {
            northbound: {
                path: [
                    [-7.1278, -34.8620], [-7.1283, -34.8613], [-7.1290, -34.8600],
                    [-7.1300, -34.8585], [-7.1308, -34.8570], [-7.1315, -34.8555],
                    [-7.1320, -34.8540], [-7.1325, -34.8525], [-7.1330, -34.8510],
                    [-7.1338, -34.8490], [-7.1345, -34.8475], [-7.1352, -34.8460],
                    [-7.1358, -34.8445], [-7.1362, -34.8435]
                ],
                stops: [
                    {name: "UFPB", position: [-7.1278, -34.8620]},
                    {name: "Av. Epitácio", position: [-7.1300, -34.8585]},
                    {name: "Praça Independência", position: [-7.1325, -34.8525]},
                    {name: "Terminal Varadouro", position: [-7.1345, -34.8475]},
                    {name: "Terminal Integração Sul", position: [-7.1362, -34.8435]}
                ]
            },
            southbound: {
                path: [
                    [-7.1362, -34.8435], [-7.1355, -34.8450], [-7.1348, -34.8465],
                    [-7.1340, -34.8480], [-7.1332, -34.8495], [-7.1325, -34.8510],
                    [-7.1318, -34.8525], [-7.1312, -34.8540], [-7.1305, -34.8555],
                    [-7.1298, -34.8570], [-7.1290, -34.8585], [-7.1285, -34.8600],
                    [-7.1280, -34.8610], [-7.1278, -34.8620]
                ],
                stops: [
                    {name: "Terminal Integração Sul", position: [-7.1362, -34.8435]},
                    {name: "Terminal Varadouro", position: [-7.1348, -34.8465]},
                    {name: "Praça Independência", position: [-7.1325, -34.8510]},
                    {name: "Av. Epitácio", position: [-7.1305, -34.8555]},
                    {name: "UFPB", position: [-7.1278, -34.8620]}
                ]
            }
        }
    }
};

// Initialize map (now globally available)
window.initMap = function() {
    console.log("Initializing map...");
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -7.1320, lng: -34.8530 },
        zoom: 14,
        mapTypeId: 'roadmap'
    });
    loadRoute();
};

function loadRoute() {
    clearBuses();
    clearRoutes();
    infoWindows.forEach(iw => iw.close());
    infoWindows = [];

    const direction = jpBusRoutes["527"].directions[selectedDirection];
    if (!direction) return;

    // Draw route
    const routePath = direction.path.map(p => ({ lat: p[0], lng: p[1] }));
    const polyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: jpBusRoutes["527"].color,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
    });
    routePolylines.push(polyline);

    // Draw stops
    direction.stops.forEach((stop, i) => {
        const marker = new google.maps.Marker({
            position: { lat: stop.position[0], lng: stop.position[1] },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#0056b3",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
                scale: 8
            },
            title: stop.name
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="info-window"><h4>${stop.name}</h4><p>Ordem: ${i+1}</p></div>`
        });

        marker.addListener("click", () => {
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });
        infoWindows.push(infoWindow);
    });

    // Initialize buses
    initializeBuses(direction);
    startBusMovement();
    updateBusInfo(direction);

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, {top: 50, bottom: 50, left: 50, right: 50});
}

function clearBuses() {
    busMarkers.forEach(bus => bus.marker.setMap(null));
    busMarkers = [];
    if (busInterval) clearInterval(busInterval);
}

function clearRoutes() {
    routePolylines.forEach(line => line.setMap(null));
    routePolylines = [];
}

function initializeBuses(direction) {
    const numBuses = 3;
    const segmentSize = Math.floor(direction.path.length / numBuses);

    for (let i = 0; i < numBuses; i++) {
        const startIndex = Math.min(i * segmentSize, direction.path.length - 2);
        const progress = 0.1 + (i * 0.3);
        
        const marker = new google.maps.Marker({
            position: calculateBusPosition(direction.path, startIndex, progress),
            map: map,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/bus.png",
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            },
            zIndex: 999
        });

        busMarkers.push({
            marker,
            route: direction,
            currentSegment: startIndex,
            progress: progress,
            speed: 0.001 + Math.random() * 0.0005
        });
    }
}

function calculateBusPosition(path, segment, progress) {
    const start = path[segment];
    const end = path[segment + 1] || path[0];
    
    return {
        lat: start[0] + (end[0] - start[0]) * progress,
        lng: start[1] + (end[1] - start[1]) * progress
    };
}

function startBusMovement() {
    if (busInterval) clearInterval(busInterval);
    
    busInterval = setInterval(() => {
        busMarkers.forEach(bus => {
            const path = bus.route.path;
            
            bus.progress += bus.speed;
            
            if (bus.progress >= 1) {
                bus.currentSegment = (bus.currentSegment + 1) % (path.length - 1);
                bus.progress = 0;
            }

            const newPos = calculateBusPosition(path, bus.currentSegment, bus.progress);
            bus.marker.setPosition(newPos);
        });
    }, 50);
}

function updateBusInfo(direction) {
    const nextStops = busMarkers.length > 0 
        ? busMarkers[0].route.stops
            .slice(busMarkers[0].currentSegment, busMarkers[0].currentSegment + 3)
            .map(stop => `<div class="next-stop">→ ${stop.name}</div>`)
            .join("")
        : '<p>Carregando informações...</p>';

    document.getElementById("busInfo").innerHTML = `
        <h3>${selectedDirection === 'northbound' ? 'Norte' : 'Sul'} - ${busMarkers.length} ônibus ativos</h3>
        <p>Última atualização: ${new Date().toLocaleTimeString()}</p>
        <div class="next-stops">
            <h4>Próximas Paradas:</h4>
            ${nextStops}
        </div>
    `;
}