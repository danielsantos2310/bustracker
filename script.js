// Initialize map
const map = L.map('map').setView([-7.1195, -34.8450], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Global variables
let rotas = window.rotasPredefinidas || {};
let rotaAtual = null;
let drawControl;
let routeMarkers = [];
let stopMarkers = [];
let isAddingStops = false;

// Initialize drawing tools
function initDrawTools() {
    drawControl = new L.Control.Draw({
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#0056b3',
                    weight: 5
                },
                metric: true,
                showLength: true
            },
            polygon: false,
            circle: false,
            marker: false,
            rectangle: false
        },
        edit: false
    });
    map.addControl(drawControl);
}

// Toggle stop adding mode
function toggleStopAdding() {
    isAddingStops = !isAddingStops;
    const btn = document.getElementById('btn-add-stops');
    
    if (isAddingStops) {
        btn.textContent = '✔️ Finalizar Paradas';
        btn.classList.add('active');
        map.on('click', addStopManually);
    } else {
        btn.textContent = '📍 Adicionar Paradas';
        btn.classList.remove('active');
        map.off('click', addStopManually);
    }
}

// Add stop manually
function addStopManually(e) {
    const stopMarker = L.marker(e.latlng, {
        icon: L.divIcon({
            className: 'stop-icon',
            html: '📍'
        }),
        draggable: true
    })
    .bindPopup(`<b>Nova Parada</b><br>Lat: ${e.latlng.lat.toFixed(6)}<br>Lng: ${e.latlng.lng.toFixed(6)}`)
    .addTo(map);
    
    stopMarkers.push(stopMarker);
    console.log('New stop coordinate:', [e.latlng.lat, e.latlng.lng]);
    
    // Update popup when dragged
    stopMarker.on('dragend', function() {
        const newPos = stopMarker.getLatLng();
        stopMarker.setPopupContent(`<b>Nova Parada</b><br>Lat: ${newPos.lat.toFixed(6)}<br>Lng: ${newPos.lng.toFixed(6)}`);
        console.log('Updated stop coordinate:', [newPos.lat, newPos.lng]);
    });
}

// Clear all map layers
function clearMap() {
    if (rotaAtual) {
        map.removeLayer(rotaAtual);
        rotaAtual = null;
    }
    routeMarkers.forEach(marker => map.removeLayer(marker));
    routeMarkers = [];
    stopMarkers.forEach(marker => map.removeLayer(marker));
    stopMarkers = [];
}

// Load routes into selector
function atualizarSeletor() {
    const seletor = document.getElementById('seletor-rotas');
    seletor.innerHTML = '<option value="">-- Selecione --</option>';
    
    Object.keys(rotas).forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.textContent = rotas[nome].nome || nome;
        seletor.appendChild(option);
    });
}

// Load route on map
function carregarRota(nome) {
    if (!rotas[nome]) return;
    
    clearMap();
    
    try {
        // Add route line if coordinates exist
        if (rotas[nome].coordenadas && rotas[nome].coordenadas.length > 1) {
            rotaAtual = L.polyline(rotas[nome].coordenadas, {
                color: '#0056b3',
                weight: 5,
                smoothFactor: 1
            }).addTo(map);
        }

        // Add stops if they exist
        if (rotas[nome].paradas && Array.isArray(rotas[nome].paradas)) {
            rotas[nome].paradas.forEach(parada => {
                if (parada.coordenada && parada.coordenada.length === 2) {
                    const marker = L.marker(parada.coordenada, {
                        icon: L.divIcon({
                            className: 'stop-icon' + (parada.destaque ? ' destaque' : ''),
                            html: parada.icone || '📍'
                        })
                    })
                    .bindPopup(`<b>${parada.nome}</b><br>${parada.referencia || ''}`)
                    .addTo(map);
                    routeMarkers.push(marker);
                }
            });
        }

        // Fit bounds to show everything
        const bounds = new L.LatLngBounds();
        if (rotaAtual) bounds.extend(rotaAtual.getBounds());
        routeMarkers.forEach(marker => bounds.extend(marker.getLatLng()));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
        }
    } catch (error) {
        console.error('Error loading route:', error);
        alert('Erro ao carregar rota: ' + error.message);
    }
}

// Save new route
function salvarRota() {
    if (!rotaAtual) return alert('Desenhe uma rota primeiro!');
    
    const nome = document.getElementById('input-nome').value.trim();
    if (!nome) return alert('Digite um nome para a rota!');
    
    const coordenadas = rotaAtual.getLatLngs().map(ll => [ll.lat, ll.lng]);
    const paradas = stopMarkers.map((marker, index) => {
        const pos = marker.getLatLng();
        return {
            nome: `Parada ${index + 1}`,
            coordenada: [pos.lat, pos.lng],
            referencia: '',
            icone: '📍',
            destaque: false
        };
    });
    
    rotas[nome] = {
        nome: nome,
        coordenadas: coordenadas,
        paradas: paradas
    };
    
    // Generate JS code
    const codigo = `// ${nome}.js\nconst rotasPredefinidas = window.rotasPredefinidas || {};\nrotasPredefinidas['${nome}'] = ${JSON.stringify(rotas[nome], null, 4)};\nwindow.rotasPredefinidas = rotasPredefinidas;`;
    console.log('Código para salvar:\n\n' + codigo);
    
    atualizarSeletor();
    alert('Rota salva! Verifique o console para o código.');
}

// Event Listeners
document.getElementById('btn-nova-rota').addEventListener('click', () => {
    clearMap();
    map.removeControl(drawControl);
    initDrawTools();
    new L.Draw.Polyline(map, drawControl.options.draw.polyline).enable();
});

document.getElementById('btn-salvar').addEventListener('click', salvarRota);
document.getElementById('btn-add-stops').addEventListener('click', toggleStopAdding);
document.getElementById('seletor-rotas').addEventListener('change', (e) => {
    carregarRota(e.target.value);
});

// Handle drawn routes
map.on(L.Draw.Event.CREATED, (e) => {
    if (e.layerType === 'polyline') {
        rotaAtual = e.layer.addTo(map);
    }
});

// Initialize the app
initDrawTools();
atualizarSeletor();