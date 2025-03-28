// Initialize map centered on João Pessoa
const map = L.map('map').setView([-7.1195, -34.8450], 13);

// Base map layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Variables for route drawing
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
let drawControl = new L.Control.Draw({
    draw: {
        polyline: {
            shapeOptions: {
                color: '#0056b3',
                weight: 5
            }
        },
        polygon: false,
        circle: false,
        marker: false,
        rectangle: false
    },
    edit: {
        featureGroup: drawnItems
    }
});

// Add drawing controls
map.addControl(drawControl);

// Reference to the current polyline
let currentRoute = null;

// Event listeners
document.getElementById('draw-btn').addEventListener('click', () => {
    new L.Draw.Polyline(map, drawControl.options.draw.polyline).enable();
});

document.getElementById('save-btn').addEventListener('click', () => {
    if (!currentRoute) {
        alert("Desenhe a rota primeiro!");
        return;
    }
    
    const coordinates = currentRoute.getLatLngs().map(ll => [ll.lat, ll.lng]);
    console.log("Coordenadas da Rota:", coordinates);
    alert(`Rota salva com ${coordinates.length} pontos!\nVerifique o console para os dados.`);
});

// Handle drawn routes
map.on('draw:created', (e) => {
    const type = e.layerType;
    const layer = e.layer;
    
    if (type === 'polyline') {
        // Clear previous route
        drawnItems.clearLayers();
        
        // Add new route
        drawnItems.addLayer(layer);
        currentRoute = layer;
        
        // Add markers for key points
        addKeyStops(layer.getLatLngs());
    }
});

// Add stops based on your image
function addKeyStops(path) {
    const keyStops = [
        { name: "UFPB", position: path[0] },
        { name: "Epitácio", position: path[Math.floor(path.length/3)] },
        { name: "Integração", position: path[path.length-1] }
    ];
    
    keyStops.forEach(stop => {
        L.marker(stop.position, {
            icon: L.divIcon({
                className: 'stop-icon',
                html: '🟠'
            })
        })
        .bindPopup(`<b>${stop.name}</b>`)
        .addTo(map);
    });
}

// Load your reference image as overlay (optional)
const imageBounds = [
    [-7.18, -34.92], // SW corner
    [-7.08, -34.80]  // NE corner
];
L.imageOverlay('https://i.imgur.com/REFERENCE_IMAGE.jpg', imageBounds).addTo(map);