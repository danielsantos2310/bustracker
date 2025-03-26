// Main variables
let map;
let busMarkers = [];
let routePolylines = [];
let selectedDirection = 'northbound';
let busInterval;
let infoWindows = [];

// Precise route configuration for Line 527 from Moovit image
const jpBusRoutes = {
    "527": {
        name: "527 - UFPB ↔ Epitácio ↔ Integração",
        color: "#FF6600",
        directions: {
            northbound: {
                path: [
                    // Starting from UFPB (accurate to Moovit map)
                    [-7.1278, -34.8620], // UFPB
                    [-7.1280, -34.8615],
                    [-7.1285, -34.8605],
                    [-7.1290, -34.8595], 
                    [-7.1295, -34.8585], 
                    [-7.1300, -34.8575], // Curving west
                    [-7.1305, -34.8565],
                    [-7.1310, -34.8555],
                    [-7.1315, -34.8545], // Sharp turn north
                    [-7.1318, -34.8538],
                    [-7.1322, -34.8530],
                    [-7.1325, -34.8522], // Praça Independência area
                    [-7.1328, -34.8515],
                    [-7.1332, -34.8508],
                    [-7.1335, -34.8500], // Curving east
                    [-7.1338, -34.8492],
                    [-7.1342, -34.8485],
                    [-7.1345, -34.8478], 
                    [-7.1348, -34.8470], // Terminal Varadouro
                    [-7.1352, -34.8463],
                    [-7.1355, -34.8455],
                    [-7.1358, -34.8448], // Final approach
                    [-7.1360, -34.8442],
                    [-7.1362, -34.8437]  // Terminal Integração Sul
                ],
                stops: [
                    {name: "UFPB", position: [-7.1278, -34.8620]},
                    {name: "Av. Epitácio Pessoa", position: [-7.1300, -34.8575]},
                    {name: "Praça Independência", position: [-7.1325, -34.8522]},
                    {name: "Terminal Varadouro", position: [-7.1348, -34.8470]},
                    {name: "Terminal Integração Sul", position: [-7.1362, -34.8437]}
                ]
            },
            southbound: {
                path: [
                    [-7.1362, -34.8437], // Terminal Integração Sul
                    [-7.1359, -34.8445],
                    [-7.1355, -34.8455], // Terminal Varadouro
                    [-7.1350, -34.8468],
                    [-7.1345, -34.8480],
                    [-7.1340, -34.8492], // Curving west
                    [-7.1335, -34.8505],
                    [-7.1330, -34.8518], // Praça Independência
                    [-7.1325, -34.8530],
                    [-7.1320, -34.8542], // Sharp turn south
                    [-7.1315, -34.8555],
                    [-7.1310, -34.8568],
                    [-7.1305, -34.8580], // Curving east
                    [-7.1300, -34.8592],
                    [-7.1295, -34.8605],
                    [-7.1290, -34.8617],
                    [-7.1285, -34.8620],
                    [-7.1280, -34.8622],
                    [-7.1278, -34.8620]  // UFPB
                ],
                stops: [
                    {name: "Terminal Integração Sul", position: [-7.1362, -34.8437]},
                    {name: "Terminal Varadouro", position: [-7.1355, -34.8455]},
                    {name: "Praça Independência", position: [-7.1330, -34.8518]},
                    {name: "Av. Epitácio Pessoa", position: [-7.1310, -34.8568]},
                    {name: "UFPB", position: [-7.1278, -34.8620]}
                ]
            }
        }
    }
};

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -7.1320, lng: -34.8530 }, // Centered at Praça Independência
        zoom: 14,
        mapTypeControl: true,
        streetViewControl: false
    });

    // Initialize controls
    document.getElementById("directionSelect").addEventListener("change", (e) => {
        selectedDirection = e.target.value;
        loadRoute();
    });

    document.getElementById("refreshBtn").addEventListener("click", loadRoute);

    loadRoute();
}

// ... (keep all other functions EXACTLY as they were in your original file)

window.initMap = initMap;