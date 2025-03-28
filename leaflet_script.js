// Route Configuration
const route527 = {
    northbound: {
        path: [
            [-7.1278, -34.8620], [-7.1283, -34.8613], [-7.1290, -34.8600],
            [-7.1300, -34.8585], [-7.1308, -34.8570], [-7.1315, -34.8555],
            [-7.1320, -34.8540], [-7.1325, -34.8525], [-7.1330, -34.8510],
            [-7.1338, -34.8490], [-7.1345, -34.8475], [-7.1352, -34.8460],
            [-7.1358, -34.8445], [-7.1362, -34.8435]
        ],
        stops: [
            { name: "UFPB", position: [-7.1278, -34.8620] },
            { name: "Av. Epitácio", position: [-7.1300, -34.8585] },
            { name: "Praça Independência", position: [-7.1325, -34.8525] },
            { name: "Terminal Varadouro", position: [-7.1345, -34.8475] },
            { name: "Terminal Integração Sul", position: [-7.1362, -34.8435] }
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
            { name: "Terminal Integração Sul", position: [-7.1362, -34.8435] },
            { name: "Terminal Varadouro", position: [-7.1348, -34.8465] },
            { name: "Praça Independência", position: [-7.1325, -34.8510] },
            { name: "Av. Epitácio", position: [-7.1305, -34.8555] },
            { name: "UFPB", position: [-7.1278, -34.8620] }
        ]
    }
};

// Map Elements
let map;
let routeLayer;
let busMarkers = [];
let stopMarkers = [];
let selectedDirection = 'northbound';

// Initialize Map
function initMap() {
    map = L.map('map').setView([-7.1320, -34.8530], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    loadRoute();
}

// Load Route Data
function loadRoute() {
    // Clear existing elements
    if (routeLayer) map.removeLayer(routeLayer);
    stopMarkers.forEach(marker => map.removeLayer(marker));
    busMarkers.forEach(marker => map.removeLayer(marker));
    
    const direction = route527[selectedDirection];
    
    // Draw Route Path
    routeLayer = L.polyline(direction.path, {
        color: '#FF6600',
        weight: 5
    }).addTo(map);
    
    // Add Stops
    direction.stops.forEach(stop => {
        const marker = L.circleMarker(stop.position, {
            className: 'stop-marker',
            radius: 6
        }).bindPopup(stop.name).addTo(map);
        stopMarkers.push(marker);
    });
    
    // Add Buses
    addBuses(direction);
    updateBusInfo();
    
    // Fit map to route
    map.fitBounds(routeLayer.getBounds());
}

// Add Buses to Map
function addBuses(direction) {
    const numBuses = 3;
    const segmentSize = Math.floor(direction.path.length / numBuses);
    
    for (let i = 0; i < numBuses; i++) {
        const startIndex = i * segmentSize;
        const position = direction.path[startIndex];
        
        const bus = L.circleMarker(position, {
            className: 'bus-marker',
            radius: 8
        }).addTo(map);
        
        busMarkers.push({
            marker: bus,
            currentPosition: startIndex,
            direction: direction.path
        });
    }
}

// Update Bus Information Panel
function updateBusInfo() {
    const nextStops = route527[selectedDirection].stops
        .slice(0, 3)
        .map(stop => `<div class="next-stop">→ ${stop.name}</div>`)
        .join('');
    
    document.getElementById('busInfo').innerHTML = `
        <h3>Direção: ${selectedDirection === 'northbound' ? 'Norte' : 'Sul'}</h3>
        <p>Ônibus ativos: ${busMarkers.length}</p>
        <div class="next-stops">
            <h4>Próximas paradas:</h4>
            ${nextStops}
        </div>
    `;
}

// Event Listeners
document.getElementById('directionSelect').addEventListener('change', (e) => {
    selectedDirection = e.target.value;
    loadRoute();
});

document.getElementById('refreshBtn').addEventListener('click', loadRoute);

// Initialize the Map
document.addEventListener('DOMContentLoaded', initMap);