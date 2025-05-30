import sqlite3
import json
import random
from datetime import datetime, timedelta

conn = sqlite3.connect('air_quality.db')
cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS Показания")
cursor.execute("DROP TABLE IF EXISTS Датчики")

cursor.execute('''
CREATE TABLE Датчики (
    id INTEGER PRIMARY KEY,
    location TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    install_date TEXT NOT NULL
)
''')

cursor.execute('''
CREATE TABLE Показания (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER,
    timestamp TEXT NOT NULL,
    pm25 REAL,
    pm10 REAL,
    co2 REAL,
    temperature REAL,
    humidity REAL,
    FOREIGN KEY(sensor_id) REFERENCES Датчики(id)
)
''')
conn.commit()

conn.executescript('''
    INSERT INTO Датчики VALUES 
        (1, 'Москва, центр', 'AQI', '2024-01-01'),
        (2, 'Санкт-Петербург, Невский', 'PM2.5', '2024-02-01');
    
    INSERT INTO Показания (sensor_id, timestamp, pm25, pm10, co2, temperature, humidity) VALUES 
        (1, datetime('now', '-1 hours'), 35.5, 50.0, 450, 22.5, 65.0),
        (2, datetime('now'), 42.3, 55.0, 480, 21.0, 68.0);
''')

base_time = datetime.now()
sensor_ids = [1, 2]

for i in range(13):
    time_offset = timedelta(
        days=random.randint(0, 7),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )
    timestamp = base_time - time_offset
    
    sensor_id = sensor_ids[i % 2]
    
    if sensor_id == 1:  # Москва
        pm25 = round(random.uniform(20.0, 60.0), 1)
        pm10 = round(pm25 * random.uniform(1.1, 1.8), 1)
    else:  # СПб
        pm25 = round(random.uniform(30.0, 70.0), 1)
        pm10 = round(pm25 * random.uniform(1.2, 2.0), 1)
    
    co2 = random.randint(400, 1000)
    temperature = round(random.uniform(18.0, 25.0), 1)
    humidity = random.randint(45, 85)
    
    cursor.execute('''
        INSERT INTO Показания 
        (sensor_id, timestamp, pm25, pm10, co2, temperature, humidity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        sensor_id,
        timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        pm25,
        pm10,
        co2,
        temperature,
        humidity
    ))

conn.commit()
conn.close()

print("База данных успешно создана с 15 записями показаний")