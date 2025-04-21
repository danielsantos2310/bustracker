import pandas as pd
from datetime import datetime, time, timedelta
import pytz
import time as ttime
import os
from typing import List, Dict
import curses
from threading import Thread
from queue import Queue

class LiveBusPredictor:
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.schedule = self.load_schedule()
        self.timezone = pytz.timezone('America/Fortaleza')
        self.current_stop = None
        self.predictions = []
        self.update_queue = Queue()
        self.running = True

    def load_schedule(self) -> pd.DataFrame:
        """Load and validate the bus schedule CSV"""
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"File not found: {self.csv_path}")
        
        try:
            df = pd.read_csv(self.csv_path, encoding='utf-8-sig')
            df.columns = df.columns.str.strip()
            
            required_cols = ['Estacao'] + [f'Partida #{i}' for i in range(1, 13)]
            if not all(col in df.columns for col in required_cols):
                missing = set(required_cols) - set(df.columns)
                raise ValueError(f"Missing required columns: {missing}")
            
            for col in required_cols[1:]:
                df[col] = pd.to_datetime(df[col], format='%H:%M', errors='coerce').dt.time
                if df[col].isnull().any():
                    raise ValueError(f"Invalid time format in column {col}")
            
            return df
            
        except Exception as e:
            raise ValueError(f"Error loading CSV file: {str(e)}")

    def get_current_time(self) -> time:
        """Get current local time with timezone awareness"""
        return datetime.now(self.timezone).time()

    def calculate_delay_factor(self, current_time: time) -> float:
        """Dynamic delay calculation based on multiple factors"""
        hour = current_time.hour
        minute = current_time.minute
        weekday = datetime.now(self.timezone).weekday()  # 0=Monday
        
        # Base traffic factors
        if (7 <= hour <= 9):  # Morning rush
            factor = 1.5 + (0.3 if hour == 8 else 0)  # Peak at 8 AM
        elif (17 <= hour <= 19):  # Evening rush
            factor = 1.4 + (0.3 if hour == 18 else 0)  # Peak at 6 PM
        elif 12 <= hour <= 13:  # Lunch time
            factor = 1.2
        elif 22 <= hour or hour <= 5:  # Night time
            factor = 0.7
        else:  # Normal hours
            factor = 1.0
            
        # Weekend adjustment
        if weekday >= 5:  # Saturday or Sunday
            factor *= 0.8
            
        # Minute adjustment (more delay during peak minutes)
        if (30 <= minute <= 45) and (7 <= hour <= 9 or 17 <= hour <= 19):
            factor *= 1.1
            
        return factor

    def update_predictions(self):
        """Continuously update predictions and countdowns"""
        while self.running:
            if self.current_stop:
                current_time = self.get_current_time()
                stop_data = self.schedule[self.schedule['Estacao'] == self.current_stop]
                
                if not stop_data.empty:
                    new_predictions = []
                    for bus_num in range(1, 13):
                        col = f'Partida #{bus_num}'
                        scheduled_time = stop_data[col].iloc[0]
                        
                        if scheduled_time >= current_time:
                            delay = self.calculate_delay_factor(current_time) * max(1, bus_num * 0.25)
                            scheduled_dt = datetime.combine(datetime.today(), scheduled_time)
                            predicted_dt = scheduled_dt + timedelta(minutes=delay)
                            time_until = predicted_dt - datetime.combine(datetime.today(), current_time)
                            
                            new_predictions.append({
                                'bus': f'Ônibus {bus_num}',
                                'scheduled': scheduled_time.strftime('%H:%M'),
                                'predicted': predicted_dt.time().strftime('%H:%M'),
                                'delay_minutes': round(delay, 1),
                                'time_until': time_until,
                                'is_imminent': time_until.total_seconds() <= 300,
                                'is_delayed': delay > 3
                            })
                    
                    new_predictions.sort(key=lambda x: x['time_until'])
                    self.predictions = new_predictions[:3]
                    self.update_queue.put(True)  # Signal that update is available
            ttime.sleep(5)  # Update every 5 seconds

    def format_timedelta(self, td: timedelta) -> str:
        """Format timedelta with dynamic units"""
        total_seconds = int(td.total_seconds())
        if total_seconds <= 0:
            return "AGORA"
            
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if hours > 0:
            return f"{hours}h {minutes:02d}min"
        elif minutes > 0:
            return f"{minutes}min {seconds:02d}seg"
        else:
            return f"{seconds}seg"

    def get_all_stops(self) -> List[str]:
        """Get unique stops alphabetically sorted"""
        return sorted(self.schedule['Estacao'].drop_duplicates().tolist())

def display_ui(stdscr, predictor: LiveBusPredictor):
    """Curses-based UI for live updates"""
    curses.curs_set(0)  # Hide cursor
    stdscr.nodelay(1)  # Non-blocking input
    
    update_thread = Thread(target=predictor.update_predictions)
    update_thread.daemon = True
    update_thread.start()
    
    selected_idx = 0
    stops = predictor.get_all_stops()
    
    while True:
        stdscr.clear()
        h, w = stdscr.getmaxyx()
        
        # Header
        stdscr.addstr(0, 0, "ÔNIBUS LINHA 527 - PREVISÃO EM TEMPO REAL", curses.A_BOLD)
        stdscr.addstr(1, 0, f"⏰ {datetime.now(predictor.timezone).strftime('%H:%M:%S')}", curses.A_BOLD)
        
        if predictor.current_stop:
            # Display predictions
            stdscr.addstr(3, 0, f"📍 {predictor.current_stop}", curses.A_BOLD)
            stdscr.addstr(4, 0, "-" * (w-1))
            
            if not predictor.predictions:
                stdscr.addstr(6, 0, "Nenhum ônibus previsto para o resto do dia")
            else:
                for i, pred in enumerate(predictor.predictions):
                    attr = curses.A_BOLD if pred['is_imminent'] else curses.A_NORMAL
                    if pred['is_delayed']:
                        attr |= curses.color_pair(1)  # Red for delayed buses
                    
                    bus_str = f"{i+1}. {pred['bus']}"
                    time_str = f"{predictor.format_timedelta(pred['time_until'])}"
                    
                    stdscr.addstr(6+i*3, 0, bus_str, attr)
                    stdscr.addstr(7+i*3, 2, f"Programado: {pred['scheduled']}")
                    stdscr.addstr(7+i*3, 25, f"Previsão: {pred['predicted']}")
                    stdscr.addstr(8+i*3, 2, f"Chega em: {time_str}")
        else:
            # Display stop selection menu
            stdscr.addstr(3, 0, "SELECIONE SUA PARADA:", curses.A_BOLD)
            
            for i, stop in enumerate(stops):
                if i == selected_idx:
                    stdscr.addstr(5+i, 0, f"> {stop}", curses.A_REVERSE)
                else:
                    stdscr.addstr(5+i, 0, f"  {stop}")
        
        # Check for updates
        try:
            if predictor.update_queue.get_nowait():
                stdscr.refresh()
        except:
            pass
        
        # Handle input
        try:
            key = stdscr.getch()
            if key == curses.KEY_UP and selected_idx > 0:
                selected_idx -= 1
            elif key == curses.KEY_DOWN and selected_idx < len(stops)-1:
                selected_idx += 1
            elif key == ord('\n') and not predictor.current_stop:
                predictor.current_stop = stops[selected_idx]
            elif key == ord('q'):
                predictor.running = False
                break
        except:
            pass
        
        stdscr.refresh()
        ttime.sleep(0.1)

def main():
    try:
        # Initialize predictor
        predictor = LiveBusPredictor('527timetable.csv')
        
        # Initialize curses
        curses.wrapper(display_ui, predictor)
        
        print("\nObrigado por usar o sistema. Boa viagem!")
        
    except Exception as e:
        print(f"\n❌ ERRO: {str(e)}")
        print("Por favor, verifique o arquivo CSV e tente novamente.")

if __name__ == "__main__":
    main()