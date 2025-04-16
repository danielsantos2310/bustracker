const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock traffic data (can be expanded with real data)
const trafficProfiles = {
  normal: 30, // km/h
  rush_hour: 18,
  night: 40
};

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function calculateTimetable(paradas, startTime = '06:00') {
  const timetable = [];
  let [hours, minutes] = startTime.split(':').map(Number);
  let currentTime = new Date().setHours(hours, minutes, 0);
  let totalDistance = 0;

  for (let i = 0; i < paradas.length; i++) {
    const now = new Date(currentTime);
    timetable.push({
      sequence: i + 1,
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      lat: paradas[i].coordenada[0],
      lng: paradas[i].coordenada[1],
      distanceFromStart: totalDistance
    });

    if (i < paradas.length - 1) {
      const distance = calculateDistance(
        paradas[i].coordenada[0], paradas[i].coordenada[1],
        paradas[i+1].coordenada[0], paradas[i+1].coordenada[1]
      );
      
      const currentHour = now.getHours();
      let speed = trafficProfiles.normal;
      if (currentHour >= 7 && currentHour <= 9) speed = trafficProfiles.rush_hour;
      else if (currentHour >= 17 && currentHour <= 19) speed = trafficProfiles.rush_hour;
      else if (currentHour >= 22 || currentHour <= 5) speed = trafficProfiles.night;

      const travelTime = (distance / (speed * 1000)) * 60; // in minutes
      currentTime += travelTime * 60 * 1000;
      totalDistance += distance;
    }
  }

  return timetable;
}

app.get('/api/timetable/527', (req, res) => {
  const linha527 = require('./rotas/linha-527.js').rotasPredefinidas['527'];
  const startTime = req.query.startTime || '06:00';
  const timetable = calculateTimetable(linha527.paradas, startTime);
  res.json(timetable);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));