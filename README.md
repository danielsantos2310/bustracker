# JP Bus Tracker 🚌

An open-source bus tracking and time prediction project built for the city of João Pessoa, Brazil. Created entirely with **free tools**, this project aims to make public transport more accessible, informative, and smarter—even in environments without GPS or real-time APIs.

---

## ✨ Project Overview

In João Pessoa, public bus data is limited to printed PDFs. There is no GPS tracking, no public APIs, and no real-time information. This project solves that by:
- Mapping out full bus routes and stops manually
- Predicting arrival times using Python
- Visualizing everything on a clean, interactive web map

Built by a solo developer as a challenge to see: **how far can we go using only free tools?**

---

## 🧰 Tech Stack

**Frontend**:
- HTML
- CSS
- JavaScript
- Leaflet.js

**Backend**:
- Python
- Flask

**Data**:
- Manually created CSVs based on printed PDF schedules

---

## 🔍 Key Features
- Interactive map with bus routes
- Manually plotted bus stops
- Time prediction model based on schedule + traffic conditions
- Simple and responsive interface

---

## ⏰ Time Prediction Engine

Implemented in Python, the time predictor:
- Loads bus schedules from CSV
- Reads current time with timezone awareness
- Applies dynamic **delay factors** (rush hour, night, etc.)
- Outputs ETA with readable format (e.g., "arrives in 7min")

### Delay Logic:
- Rush hours: +50%
- Lunch: +20%
- Night: -20%
- Default delay: 2 minutes

### Current Limitations:
- No GPS or real-time feeds
- Prediction is based on schedule and patterns only

---

## 📷 Screenshots
- Old UI vs new UI
- Route map preview
- Console output from time predictor

> *(Screenshots are available in project media folder)*

---

## 🚀 How to Run Locally

**Frontend:**
- Open `index.html` in browser

**Backend:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**CSV Format:**
Make sure your timetable CSV has columns like:
- Estacao
- Partida #1 to Partida #12 (HH:MM format)

---

## ⚙️ Planned Improvements
- Integration with Waze API for live traffic data
- Moovit API for volunteer-reported transit positions
- Mobile-friendly layout
- Unified frontend/backend interface
- User feedback for delays

---

## 👤 Credits & Acknowledgements
- Built by: **Daniel Santos**
- Inspired by the people of João Pessoa 
- Help from: Stack Overflow, Reddit, YouTube tutorials (freeCodeCamp, TechWithTim, etc.)
- Tools: Python, Flask, Leaflet, HTML/CSS/JS

---

## 🔗 License
MIT License — free to use, adapt, and share.

---

Follow the journey on [LinkedIn](#) and see how far we can go using creativity, code, and free tools only. 

> *No GPS? No problem. Just build it anyway.*
