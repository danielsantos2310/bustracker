// Main variables
let map;
let busMarkers = [];
let routePolylines = [];
let busRoutes = {};
let selectedRoute = null;
let busInterval;

// Real bus routes of João Pessoa (approximate coordinates)
const jpBusRoutes = {
    "510": {
        name: "510 - Centro ↔ Manaíra",
        path: [
            [-7.1195, -34.8450], // Centro
            [-7.1200, -34.8420], // Av. Epitácio Pessoa
            [-7.1215, -34.8380], // Tambiá
            [-7.1230, -34.8350], // Manaíra
            [-7.1245, -34.8320]  // Cabo Branco
        ],
        color: "#FF0000"
    },
    "210": {
        name: "210 - Altiplano ↔ Bessa",
        path: [
            [-7.1150, -34.8400], // Altiplano
            [-7.1165, -34.8370], // Bancários
            [-7.1180, -34.8340], // Miramar
            [-7.1195, -34.8310]  // Bessa
        ],
        color: "#00AA00"
    },
    "301": {
        name: "301 - Valentina ↔ Cabo Branco",
        path: [
            [-7.1300, -34.8500], // Valentina
            [-7.1250, -34.8450], // Geisel
            [-7.1200, -34.8400], // Centro
            [-7.1150, -34.8350]  // Cabo Branco
        ],
        color: "#0000FF"
    }
};

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -7.1195, lng: -34.8450 },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Initialize route selector
    initializeRouteSelector();
    
    // Load default route (510)
    loadRoute("510");
}

// Initialize route dropdown
function initializeRouteSelector() {
    const routeSelect = document.getElementById("routeSelect");
    
    // Add options for each route
    for (const routeId in jpBusRoutes) {
        const option = document.createElement("option");
        option.value = routeId;
        option.textContent = jpBusRoutes[routeId].name;
        routeSelect.appendChild(option);
    }
    
    // Add event listener
    routeSelect.addEventListener("change", (e) => {
        loadRoute(e.target.value);
    });
}

// Load a specific route
function loadRoute(routeId) {
    // Clear existing buses and routes
    clearBuses();
    clearRoutes();
    
    // Set selected route
    selectedRoute = jpBusRoutes[routeId];
    
    // Draw the route
    drawRoute(selectedRoute);
    
    // Initialize buses on this route
    initializeBuses(selectedRoute);
    
    // Start bus movement
    startBusMovement();
    
    // Update info panel
    updateBusInfo(selectedRoute.name);
}

// Draw the route path
function drawRoute(route) {
    const routePath = route.path.map(point => ({
        lat: point[0],
        lng: point[1]
    }));
    
    const polyline = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: route.color,
        strokeOpacity: 0.7,
        strokeWeight: 4,
        map: map
    });
    
    routePolylines.push(polyline);
    
    // Fit map to route bounds
    const bounds = new google.maps.LatLngBounds();
    routePath.forEach(point => bounds.extend(point));
    map.fitBounds(bounds);
}

// Initialize buses on the route
function initializeBuses(route) {
    // Create 3 buses for this route
    for (let i = 0; i < 3; i++) {
        // Distribute buses along the route
        const segment = Math.floor(i * (route.path.length - 1) / 2);
        const progress = (i * 0.5) % 1;
        
        const startPoint = route.path[segment];
        const endPoint = route.path[segment + 1] || route.path[0];
        
        const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * progress;
        const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * progress;
        
        const marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: `Ônibus ${i+1} - ${route.name}`,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/bus.png",
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });
        
        busMarkers.push({
            marker,
            route,
            currentSegment: segment,
            progress,
            speed: 0.002 + Math.random() * 0.003 // Random speed
        });
    }
}

// Start bus movement animation
function startBusMovement() {
    if (busInterval) clearInterval(busInterval);
    
    busInterval = setInterval(() => {
        busMarkers.forEach(bus => {
            const { marker, route, currentSegment } = bus;
            
            // Get current and next points
            const path = route.path;
            const startPoint = path[currentSegment];
            const endPoint = path[currentSegment + 1] || path[0];
            
            // Update progress
            bus.progress += bus.speed;
            
            // If reached end of segment
            if (bus.progress >= 1) {
                bus.progress = 0;
                bus.currentSegment = (bus.currentSegment + 1) % (path.length - 1);
            }
            
            // Calculate new position
            const newLat = startPoint[0] + (endPoint[0] - startPoint[0]) * bus.progress;
            const newLng = startPoint[1] + (endPoint[1] - startPoint[1]) * bus.progress;
            
            // Update marker position
            marker.setPosition({ lat: newLat, lng: newLng });
        });
    }, 50); // Update every 50ms for smooth animation
}

// Clear all buses from map
function clearBuses() {
    busMarkers.forEach(bus => bus.marker.setMap(null));
    busMarkers = [];
    if (busInterval) clearInterval(busInterval);
}

// Clear all routes from map
function clearRoutes() {
    routePolylines.forEach(line => line.setMap(null));
    routePolylines = [];
}

// Update bus information panel
function updateBusInfo(info) {
    document.getElementById("busInfo").innerHTML = `
        <h3>${info}</h3>
        <p>${busMarkers.length} ônibus em operação</p>
        <p>Última atualização: ${new Date().toLocaleTimeString()}</p>
    `;
}

// Refresh button functionality
document.getElementById("refreshBtn").addEventListener("click", () => {
    if (selectedRoute) {
        loadRoute(Object.keys(jpBusRoutes).find(key => jpBusRoutes[key] === selectedRoute));
    }
});

// Initialize the app when Google Maps API is loaded
window.initMap = initMap;