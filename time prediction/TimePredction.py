import pandas as pd
from datetime import datetime, time, timedelta
import pytz
from typing import List, Dict

class BusSchedulePredictor:
    def __init__(self, csv_path: str):
        self.schedule = self.load_schedule(csv_path)
        self.timezone = pytz.timezone('America/Fortaleza')
    
    def load_schedule(self, path: str) -> pd.DataFrame:
        """Load and preprocess the bus schedule CSV"""
        # Read CSV with correct encoding and handling quotes
        df = pd.read_csv(path, encoding='utf-8-sig')
        
        # Clean column names (remove extra quotes if present)
        df.columns = df.columns.str.strip()
        
        # Convert all departure columns to time objects
        time_cols = [col for col in df.columns if col.startswith('Partida #')]
        for col in time_cols:
            df[col] = pd.to_datetime(df[col], format='%H:%M').dt.time
            
        print(df.columns)
        return df
    
    def get_current_time(self) -> time:
        """Get current local time with timezone awareness"""
        now = datetime.now(self.timezone)
        return now.time()
    
    def calculate_delay_factor(self, current_time: time) -> float:
        """Calculate delay multiplier based on time of day"""
        hour = current_time.hour
        
        if (7 <= hour <= 9) or (17 <= hour <= 19):  # Rush hours
            return 1.5
        elif 12 <= hour <= 13:   # Lunch time
            return 1.2
        elif 22 <= hour or hour <= 5:  # Night time
            return 0.8
        else:  # Normal hours
            return 1.0
    
    def predict_next_buses(self, stop_name: str, max_results: int = 3) -> List[Dict]:
        """Predict next bus arrivals for a specific stop"""
        current_time = self.get_current_time()
        delay_factor = self.calculate_delay_factor(current_time)
        
        # Find the selected stop (exact match)
        stop_data = self.schedule[self.schedule['Estacao'] == stop_name]
        if stop_data.empty:
            return []
        
        predictions = []
        
        # Check all departure columns (Partida #1 to Partida #12)
        for col in [f'Partida #{i}' for i in range(1, 13)]:
            scheduled_time = stop_data[col].iloc[0]
            
            if scheduled_time >= current_time:
                # Calculate delay (base 2 minutes * factor)
                base_delay = 2 * delay_factor
                scheduled_dt = datetime.combine(datetime.today(), scheduled_time)
                predicted_dt = scheduled_dt + timedelta(minutes=base_delay)
                
                predictions.append({
                    'bus': col.replace('Partida #', 'Ônibus '),
                    'scheduled': scheduled_time.strftime('%H:%M'),
                    'predicted': predicted_dt.time().strftime('%H:%M'),
                    'delay_minutes': round(base_delay, 1),
                    'time_until_arrival': self.format_timedelta(predicted_dt - datetime.combine(datetime.today(), current_time))
                })
        
        # Sort by scheduled time and limit results
        predictions.sort(key=lambda x: x['scheduled'])
        return predictions[:max_results]

    def format_timedelta(self, td: timedelta) -> str:
        """Format timedelta as human-readable string"""
        total_seconds = int(td.total_seconds())
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if hours > 0:
            return f"{hours}h {minutes}min"
        elif minutes > 0:
            return f"{minutes}min {seconds}seg"
        else:
            return f"{seconds}seg"

    def get_all_stops(self) -> List[str]:
        """Get list of all available stops"""
        if 'Estacao' not in self.schedule.columns:
            print("Error: 'Estacao' column not found in the schedule.")
            return []
        return self.schedule['Estacao'].tolist()

def main():
    # Initialize predictor with CSV file
    predictor = BusSchedulePredictor('527timetable.csv')
    
    print("\nÔnibus Linha 527 - Previsão de Horários")
    print("=======================================\n")
    
    # Show available stops
    stops = predictor.get_all_stops()
    print("Paradas disponíveis:")
    for idx, stop in enumerate(stops, 1):
        print(f"{idx}. {stop}")
    
    # Get user input
    try:
        selection = int(input("\nDigite o número da sua parada: ")) - 1
        selected_stop = stops[selection]
    except (ValueError, IndexError):
        print("\n⚠️ Seleção inválida! Por favor, digite um número válido.")
        return
    
    # Get and display predictions
    predictions = predictor.predict_next_buses(selected_stop)
    current_time = predictor.get_current_time().strftime('%H:%M')
    
    print(f"\n⏰ Hora atual: {current_time}")
    print(f"📍 Parada selecionada: {selected_stop}\n")
    
    if not predictions:
        print("Nenhum ônibus previsto para o resto do dia")
        return
    
    print("Próximos ônibus:")
    for idx, pred in enumerate(predictions, 1):
        print(f"\n{idx}. {pred['bus']}")
        print(f"   - Horário programado: {pred['scheduled']}")
        print(f"   - Previsão realista: {pred['predicted']} (chega em {pred['time_until_arrival']})")
        print(f"   - Atraso estimado: {pred['delay_minutes']} minutos")

if __name__ == "__main__":
    main()