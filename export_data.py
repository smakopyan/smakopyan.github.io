import sqlite3
import json
from datetime import datetime, timedelta

def export_data():
    conn = sqlite3.connect('air_quality.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
        SELECT 
            p.id,
            d.location AS city,
            p.timestamp,
            p.pm25,
            p.pm10,
            p.co2,
            p.temperature,
            p.humidity
        FROM Показания p
        JOIN Датчики d ON p.sensor_id = d.id
        WHERE p.timestamp >= DATE('now', '-7 days');
    ''')

    data = [dict(row) for row in cursor.fetchall()]
    
    with open('data.json', 'w') as f:
        json.dump(data, f, default=str)
    
    conn.close()

if __name__ == "__main__":
    export_data()