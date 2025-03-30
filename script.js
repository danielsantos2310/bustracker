// Configuração inicial
const map = L.map('map').setView([-7.1195, -34.8450], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Variáveis globais
let rotas = {};
let rotaAtual = null;

// Carregar rotas existentes
if (typeof rotasPredefinidas !== 'undefined') {
    rotas = {...rotasPredefinidas};
    atualizarSeletor();
}

// Funções principais
function criarRota(nome, coordenadas) {
    rotas[nome] = {
        nome: nome,
        coordenadas: coordenadas
    };
    
    // Criar arquivo JS (simulado)
    const codigo = `// ${nome}.js\nconst rotasPredefinidas = rotasPredefinidas || {};\nrotasPredefinidas['${nome}'] = ${JSON.stringify(rotas[nome], null, 4)};\n`;
    console.log('Código para salvar:\n\n' + codigo);
}

function carregarRota(nome) {
    if (!rotas[nome]) return;
    
    if (rotaAtual) map.removeLayer(rotaAtual);
    
    rotaAtual = L.polyline(rotas[nome].coordenadas, {
        color: '#0056b3',
        weight: 5
    }).addTo(map);
    
    map.fitBounds(rotaAtual.getBounds());
}

function atualizarSeletor() {
    const seletor = document.getElementById('seletor');
    seletor.innerHTML = '<option value="">-- Selecione --</option>';
    
    Object.keys(rotas).forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.textContent = nome;
        seletor.appendChild(option);
    });
}

// Event Listeners
document.getElementById('novarota').addEventListener('click', () => {
    if (rotaAtual) map.removeLayer(rotaAtual);
    rotaAtual = new L.Polyline([], {color: '#0056b3'}).addTo(map);
});

document.getElementById('salvar').addEventListener('click', () => {
    const nome = document.getElementById('nome').value.trim();
    if (!nome || !rotaAtual) return alert('Dados incompletos!');
    
    const coordenadas = rotaAtual.getLatLngs().map(p => [p.lat, p.lng]);
    criarRota(nome, coordenadas);
    atualizarSeletor();
    alert('Rota salva! Verifique o console para o código.');
});

document.getElementById('seletor').addEventListener('change', (e) => {
    carregarRota(e.target.value);
});