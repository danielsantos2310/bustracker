import json
from datetime import datetime, timedelta

class BusPredictor:
    def __init__(self, route_file='rotas/linha-527.js'):
        with open(route_file) as f:
            data = f.read().split('=', 1)[1].strip().rstrip(';')
            self.route = json.loads(data)
        
        # Hardcoded schedule (adjust based on real data)
        self.schedule = {
            "UFPB": ["06:00", "07:10", "08:20", "09:30", "10:40", "11:50"],
            "Shopping Tambiá": ["06:15", "07:25", "08:35", "09:45", "10:55", "12:05"],
            "Terminal Varadouro": ["06:30", "07:40", "08:50", "10:00", "11:10", "12:20"]
        }
        
        # Average segment times (minutes)
        self.segment_times = {
            "UFPB_to_Shopping": 15,
            "Shopping_to_Terminal": 15
        }

    def predict(self, stop_name, current_time_str):
        """Returns next 3 predicted arrivals for a stop"""
        now = datetime.strptime(current_time_str, "%H:%M")
        predictions = []
        
        for dep_time_str in self.schedule["UFPB"]:
            dep_time = datetime.strptime(dep_time_str, "%H:%M")
            
            # Calculate arrival time
            if stop_name == "UFPB":
                arrival = dep_time
            elif stop_name == "Shopping Tambiá":
                arrival = dep_time + timedelta(minutes=self.segment_times["UFPB_to_Shopping"])
            else:
                arrival = dep_time + timedelta(
                    minutes=self.segment_times["UFPB_to_Shopping"] + 
                    self.segment_times["Shopping_to_Terminal"]
                )
            
            # Add traffic delay (15% during rush hours)
            if 7 <= now.hour < 9 or 17 <= now.hour < 19:
                arrival += timedelta(minutes=5)
                
            if arrival > now:
                predictions.append({
                    "stop": stop_name,
                    "scheduled": dep_time_str,
                    "predicted": arrival.strftime("%H:%M"),
                    "delay_minutes": (arrival - now).seconds // 60
                })
        
        return predictions[:3]