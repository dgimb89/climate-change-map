const HOURS_PER_SECOND = 24;
const FPS = 60;
const STORMS_PER_YEAR = 47;
const STORMS_MAX_SPEED = 350;
const FRAMES_PER_ITERATION = 3/HOURS_PER_SECOND*FPS;

let tropical_cyclones = undefined;
let sampled_storms_id = 0;
let running_storms = [];

var tc_positions = {
    'type': 'FeatureCollection',
    'features': []
};

function updateTcs(tcs) {
    sampled_storms_id = tcs;
}

function loadTcs() {
    fetch('data/tc/tropical_cyclones.json')
    .then(response => response.json())
    .then(function (json) { tropical_cyclones = json; }); 
}

function initializeTcs() {
    loadTcs();
    map.addSource('tc_positions', {
        'type': 'geojson',
        'data': tc_positions
    });
    map.loadImage(
        './res/tc_north.png',
        function (error, image) {
            if (error) throw error;
            map.addImage('tc_north', image);
            map.loadImage(
                './res/tc_north.png',
                function (error, image) {
                    if (error) throw error;
                    map.addImage('tc_south', image);
                    map.addLayer({
                        'id': 'tcs',
                        'source': 'tc_positions',
                        'type': 'symbol',
                        'layout': {
                            'icon-image': ['get', 'ortho'],
                            'icon-rotate': ['get', 'bearing'],
                            'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 1, ['get', 'size1'], 10, ['get', 'size10']],
                            'icon-rotation-alignment': 'map',
                            'icon-allow-overlap': true,
                            'icon-ignore-placement': true
                        },
                        'paint': {
                            'icon-opacity': ['get', 'opacity']
                        }
                    });
                }
            );
        }
    );
    animateTcs();
}

function addNewStorms() {
    if (tropical_cyclones != undefined) {
        sampled_storms = tropical_cyclones[sampled_storms_id].samples;
        const probability = STORMS_PER_YEAR/365/24*HOURS_PER_SECOND/FPS/sampled_storms.length;
        for(let i=0; i<sampled_storms.length;i++) {
            if (Math.random() < probability) {
                running_storms.push({i: 0, bearing: Math.random()*360, samples: sampled_storms[i]});
            }
        }
    }
}

function cleanupOldStorms() {
    const still_running_storms = [];
    for(let i=0;i<running_storms.length;i++) {
        if (running_storms[i].i < running_storms[i].samples.length*FRAMES_PER_ITERATION) {
            still_running_storms.push(running_storms[i]);
        }
    }
    running_storms = still_running_storms;
}

function interpolate_linear(l1, l2, fraction) {
    return l1+(l2-l1)*fraction;
}

function interpolate_storm_attr(storm, attribute) {
    const index1 = Math.floor(storm.i/FRAMES_PER_ITERATION);
    const index2 = index1+1 >= storm.samples.length ? index1 : index1+1;
    const fraction = (storm.i/FRAMES_PER_ITERATION)%1;

    return interpolate_linear(storm.samples[index1][attribute], storm.samples[index2][attribute], fraction);
}

function animateTcs() {
    addNewStorms();
    cleanupOldStorms();

    tc_positions.features = [];
    for(let i=0;i<running_storms.length;i++) {
        const index = Math.floor(running_storms[i].i/FRAMES_PER_ITERATION);
        const sample = running_storms[i].samples[index];
        const is_northern = sample.lat > 0;
        const relSpeed = Math.max(0.1, interpolate_storm_attr(running_storms[i], 'speed')/STORMS_MAX_SPEED);
        const rotation = relSpeed*HOURS_PER_SECOND/FPS*360/10;
        running_storms[i].bearing += ((is_northern ? -1 : 1) * rotation) % 360;
        tc_positions.features.push({
            'type': 'Feature',
            'properties': { 
                'bearing': running_storms[i].bearing,
                'ortho': is_northern ? 'tc_north' : 'tc_south',
                'size1' : relSpeed*0.2,
                'size10': relSpeed*0.2*1024,
                'opacity': Math.min(1, relSpeed*4)
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [
                    interpolate_storm_attr(running_storms[i], 'lon'),
                    interpolate_storm_attr(running_storms[i], 'lat')
                ]
            }
        });
        running_storms[i].i += 1;
    }
    map.getSource('tc_positions').setData(tc_positions);
    requestAnimationFrame(animateTcs);
}