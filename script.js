// Main variables
let map;
let busMarkers = [];
let routePolylines = [];
let selectedDirection = 'northbound';
let busInterval;
let infoWindows = [];

// Detailed route configuration for Line 527
const jpBusRoutes = {
    "527": {
        name: "527 - Integração Norte Sul",
        color: "#FF6600",
        directions: {
            northbound: {
                path: [
                    // Starting from Terminal Integração Norte (Via Expressa Padre Zé)
                    [-7.1180, -34.8825], // Terminal Integração Norte
                    [-7.1190, -34.8810], // Rua Vereador João Freire
                    [-7.1200, -34.8795],
                    [-7.1210, -34.8775], 
                    [-7.1223, -34.8757], // Hospital de Trauma
                    [-7.1230, -34.8740], // Av. Comandante Matos Cardoso
                    [-7.1237, -34.8723],
                    [-7.1244, -34.8705],
                    [-7.1250, -34.8690], // Shopping Tambiá
                    [-7.1258, -34.8672],
                    [-7.1265, -34.8655], // Praça das Muriçocas
                    [-7.1272, -34.8635],
                    [-7.1278, -34.8620], // UFPB
                    [-7.1285, -34.8600],
                    [-7.1290, -34.8585],
                    [-7.1295, -34.8570], // Viaduto BR-230
                    [-7.1300, -34.8560], // Centro
                    [-7.1308, -34.8540],
                    [-7.1312, -34.8530], // Extra Bairro dos Estados
                    [-7.1319, -34.8510],
                    [-7.1324, -34.8500], // Praça Independência
                    [-7.1331, -34.8478],
                    [-7.1335, -34.8468], // Terminal Varadouro
                    [-7.1342, -34.8449],
                    [-7.1346, -34.8437]  // Terminal Integração Sul
                ],
                stops: [
                    {name: "Terminal Integração Norte", position: [-7.1180, -34.8825]},
                    {name: "Hospital de Trauma", position: [-7.1223, -34.8757]},
                    {name: "Shopping Tambiá", position: [-7.1250, -34.8690]},
                    {name: "UFPB", position: [-7.1278, -34.8620]},
                    {name: "Centro", position: [-7.1300, -34.8560]},
                    {name: "Praça Independência", position: [-7.1324, -34.8500]},
                    {name: "Terminal Varadouro", position: [-7.1335, -34.8468]},
                    {name: "Terminal Integração Sul", position: [-7.1346, -34.8437]}
                ]
            },
            southbound: {
                path: [
                    [-7.1346, -34.8437], // Terminal Integração Sul
                    [-7.1339, -34.8458],
                    [-7.1335, -34.8468], // Terminal Varadouro
                    [-7.1328, -34.8487],
                    [-7.1324, -34.8500], // Praça Independência
                    [-7.1317, -34.8515],
                    [-7.1312, -34.8530], // Extra Bairro dos Estados
                    [-7.1304, -34.8553],
                    [-7.1300, -34.8560], // Centro
                    [-7.1292, -34.8585],
                    [-7.1286, -34.8600],
                    [-7.1278, -34.8620], // UFPB
                    [-7.1270, -34.8643],
                    [-7.1262, -34.8665], // Praça das Muriçocas
                    [-7.1253, -34.8686],
                    [-7.1244, -34.8705],
                    [-7.1235, -34.8726],
                    [-7.1226, -34.8747],
                    [-7.1218, -34.8768],
                    [-7.1209, -34.8789],
                    [-7.1198, -34.8809],
                    [-7.1180, -34.8825]  // Terminal Integração Norte
                ],
                stops: [
                    {name: "Terminal Integração Sul", position: [-7.1346, -34.8437]},
                    {name: "Terminal Varadouro", position: [-7.1335, -34.8468]},
                    {name: "Praça Independência", position: [-7.1324, -34.8500]},
                    {name: "Centro", position: [-7.1300, -34.8560]},
                    {name: "UFPB", position: [-7.1278, -34.8620]},
                    {name: "Shopping Tambiá", position: [-7.1250, -34.8690]},
                    {name: "Hospital de Trauma", position: [-7.1223, -34.8757]},
                    {name: "Terminal Integração Norte", position: [-7.1180, -34.8825]}
                ]
            }
        }
    }
};

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -7.1278, lng: -34.8620 }, // Centered at UFPB
        zoom: 14,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false
    });

    // Initialize controls
    const directionSelect = document.getElementById("directionSelect");
    directionSelect.addEventListener("change", (e) => {
        selectedDirection = e.target.value;
        loadRoute();
    });

    document.getElementById("refreshBtn").addEventListener("click", loadRoute);

    // Initial load
    loadRoute();
}

function loadRoute() {
    // Clear existing elements
    clearBuses();
    clearRoutes();
    infoWindows.forEach(iw => iw.close());
    infoWindows = [];

    const route = jpBusRoutes["527"];
    const direction = route.directions[selectedDirection];

    if (!direction) {
        console.error("Direction not found");
        return;
    }

    // Draw route and elements
    drawRoute(direction);
    drawStops(direction);
    initializeBuses(direction);
    startBusMovement();
    updateBusInfo(direction);
}

function drawRoute(direction) {
    const routePath = direction.path.map(point => ({
        lat: point[0],
        lng: point[1]
    }));
    
    const polyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: jpBusRoutes["527"].color,
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map: map
    });
    
    routePolylines.push(polyline);
    
    // Fit map to route bounds with padding
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach(point => bounds.extend(point));
    map.fitBounds(bounds, {top: 50, bottom: 50, left: 50, right: 50});
}

function drawStops(direction) {
    direction.stops.forEach((stop, index) => {
        const marker = new google.maps.Marker({
            position: { lat: stop.position[0], lng: stop.position[1] },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#0056b3",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
                scale: 6
            },
            title: stop.name
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<div class="info-window">
                        <h4>${stop.name}</h4>
                        <p>Ordem: ${index + 1}/${direction.stops.length}</p>
                        <p>${direction.stops.length - index - 1} paradas restantes</p>
                      </div>`
        });

        marker.addListener("click", () => {
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
        });
        infoWindows.push(infoWindow);
    });
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
                
                // Add random delay at stops
                if (isNearStop(path[bus.currentSegment], bus.route.stops)) {
                    bus.progress = -0.3 + Math.random() * 0.2;
                }
            }

            const newPos = calculateBusPosition(path, bus.currentSegment, bus.progress);
            bus.marker.setPosition(newPos);
        });
    }, 50);
}

function isNearStop(position, stops) {
    const positionLatLng = new google.maps.LatLng(position[0], position[1]);
    return stops.some(stop => {
        const stopLatLng = new google.maps.LatLng(stop.position[0], stop.position[1]);
        return google.maps.geometry.spherical.computeDistanceBetween(
            positionLatLng,
            stopLatLng
        ) < 50; // 50 meters
    });
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

window.initMap = initMap;