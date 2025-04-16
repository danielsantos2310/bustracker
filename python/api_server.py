from flask import Flask, jsonify, request # type: ignore
from predictive_model import BusPredictor

app = Flask(__name__)
predictor = BusPredictor()

@app.route('/predict')
def get_prediction():
    stop = request.args.get('stop')
    time = request.args.get('time', '')  # Format: "HH:MM"
    
    if not time:
        from datetime import datetime
        time = datetime.now().strftime("%H:%M")
    
    predictions = predictor.predict(stop, time)
    return jsonify({
        "status": "success",
        "stop": stop,
        "current_time": time,
        "predictions": predictions
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)