import csv
import dateutil.parser
from dataclasses import dataclass
from dataclasses import asdict
import random
import json


INPUT_FILE = "/lfs/www/climate/tropical-cyclone-tracks/ibtracs.since1980.list.v04r00.csv"
OUTPUT_FILE = "../../data/tc/tropical_cyclones.json"

@dataclass
class Storm:
    sid: str = None
    samples: list = None
    max_speed: int = 0
    hours_after_landfall: int = 0

@dataclass
class Sample:
    hour: int = 0
    lat: float = 0
    lon: float = 0
    speed: float = 0
    land: int = 0

@dataclass
class Rcp:
    name: str = None
    cat4_likelihood: float = 0
    landfall_decay: float = 0

storms = []

SID = 0
ISO_TIME = 6
NATURE = 7
LAT = 8
LON = 9
WMO_WIND = 10
TRACK_TYPE = 13
DIST2LAND = 14

INTERVAL = 3
KNOTS_TO_KMH = 1.852
CAT4_THRESHOLD = 200
EMPTY = " "
SAMPLE_SIZE = 50

def assert_interval(last_date, current_date_str):
    if last_date is not None:
        current_date = dateutil.parser.parse(current_date_str)
        diff = current_date - last_date
        if diff.hours != INTERVAL or diff.days > 0:
            print("Wrong Interval:", last_date, current_date)
        return current_date
    return last_date

def stats(storms):
    print("Storms:", len(storms))
    datapoints = [len(storm.samples) for storm in storms]
    print("Avg datapoints:", sum(datapoints) / len(storms))
    print("Max datapoints:", max(datapoints))
    print("Min datapoints:", min(datapoints))
    speed = [storm.max_speed for storm in storms]
    print("Avg max speed:", sum(speed) / len(storms))
    print("Max max speed:", max(speed))
    print("Min max speed:", min(speed))
    hours = [storm.hours_after_landfall for storm in storms]
    print("Avg hours after landfall:", sum(hours) / len(storms))
    print("Max hours after landfall:", max(hours))
    print("Avg hours after landfall of landfalling storms:", sum(hours) / len([storm for storm in storms if storm.hours_after_landfall > 0]))

with open(INPUT_FILE, newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    current_hour = 0
    last_date = None
    for row in reader:
        if row[TRACK_TYPE] != "main":
            continue
        if len(storms) == 0 or row[SID] != storms[-1].sid:
            current_hour = 0
            last_date = None
            storms.append(Storm(row[SID], [], 0, 0))
        last_date = assert_interval(last_date, row[ISO_TIME])

        storm = storms[-1]
        fallback_speed = storm.samples[-1].speed if len(storm.samples) > 0 else 0
        speed_knots = round(float(row[WMO_WIND])*KNOTS_TO_KMH, 0) if row[WMO_WIND] != EMPTY else fallback_speed
        sample = Sample(current_hour, float(row[LAT]), float(row[LON]), speed_knots, int(row[DIST2LAND]))
        storm.samples.append(sample)
        if sample.speed > storm.max_speed:
            storm.max_speed = sample.speed
        if sample.land == 0:
            storm.hours_after_landfall += INTERVAL
        
        current_hour += INTERVAL

print("STATS: ALL STORMS")
stats(storms)

rcps = [
    Rcp("RCP8.5", 1.2, 0.995),
    Rcp("RCP6.0", 1.13, 0.99),
    Rcp("RCP4.5", 1.1, 0.988),
    Rcp("RCP2.6", 1, 0.97),
]

def sample_from(storms, probabilities, sample_size):
    prob_band = sum(probabilities)
    sampled_storms = []
    for i in range(sample_size):
        selected = random.uniform(0, prob_band)
        prob_selector = 0
        for j in range(len(storms)):
            prob_selector += probabilities[j]
            if selected <= prob_selector:
                sampled_storms.append(storms[j])
                break
    return sampled_storms

def storm_probability(storm, rcp):
    cat4 = rcp.cat4_likelihood if storm.max_speed >= CAT4_THRESHOLD else 1
    #rcp.landfall_decay**storm.hours_after_landfall
    return cat4

rcp_samples = []
for rcp in rcps:
    probabilities = [storm_probability(storm, rcp) for storm in storms]
    sampled_storms = sample_from(storms, probabilities, SAMPLE_SIZE)
    print("\nSTATS:", rcp.name)
    stats(sampled_storms)
    rcp_samples.append({'label': rcp.name, 'samples': [[{'lat': s.lat, 'lon': s.lon, 'speed': s.speed} for s in storm.samples] for storm in sampled_storms]})

with open(OUTPUT_FILE, 'w+') as jsonfile:
    json.dump(rcp_samples, jsonfile)

