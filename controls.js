const SEA_COLOR = '#001234';

var yearSlider = $('#timeline').slider().on('change', updatePolygons).data('slider');

let mappings = undefined;

function createParameters(json) {
    mappings = json;

    const controls = document.getElementById('parameters');
    const params = mappings.parameters.mapping
    for (let i=0; i<params.length; i++) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = params[i].id;
        checkbox.id = params[i].id;
        checkbox.oninput = updatePolygons;

        const label = document.createElement('label');
        label.htmlFor = params[i].id;
        label.innerHTML = params[i].label;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);
        controls.appendChild(div);
    }
    updatePolygons();
}

function updatePolygons() {
    const emissions = cumulateCo2Emissions();
    console.log('Cumulated CO2 emissions until 2100:', emissions);
    const temperature = interpolate(mappings.co2.mapping, emissions);
    console.log('Temperature forecast for 2100:', temperature);
    const sealevel = interpolate(mappings.sealevel.mapping, temperature);  
    console.log('Sealevel forecast for 2100:', sealevel);
    const tcs = Math.round(interpolate(mappings.tcs.mapping, temperature))
    console.log('Tropical cyclones scenario for 2100:', tcs);

    updateTemperature(temperature);
    updateSealevel(sealevel);
    updateTcs(tcs);
}

function cumulateCo2Emissions() {
    let cumul_co2 = mappings.baseline.mapping[0].y;
    const params = mappings.parameters.mapping
    for (let i=0; i<params.length; i++) {
        const checkbox = document.getElementById(params[i].id);
        if (checkbox.checked) {
            cumul_co2 += params[i].y;
        }
    }
    return cumul_co2;
}

function interpolate(mapping, x) {
    let upper = undefined;
    let lower = undefined;
    for (let i=0; i<mapping.length; i++) {
        if (mapping[i].x >= x && (upper == undefined || mapping[i].x < upper.x)) {
            upper = mapping[i];
        }
        if (mapping[i].x <= x && (lower == undefined || mapping[i].x > lower.x)) {
            lower = mapping[i];
        }
    }
    if (upper == lower)
        return upper.y;
    if (lower == undefined)
        return upper.y;
    if (upper == undefined)
        return lower.y;
    return (x-lower.x)/(upper.x-lower.x)*(upper.y-lower.y)+lower.y
}

function updateTemperature(temperature) {
    document.getElementById('temperature').innerHTML = Math.round((temperature+1)*10)/10;
}
function updateSealevel(sealevel) {
    const layers = ['100', '05', '1', '2', '3'];
    const levels = [-100, 0.2, 0.7, 1.5, 2.5, 100];
    for (let i=0; i<layers.length; i++) {
        map.setPaintProperty('sealevel_' + layers[i], 'fill-opacity', sealevel >= levels[i] && sealevel < levels[i+1]  ? 0.9 : 0);  
    }
}

function loadMappings() {
    fetch('data/mappings.json')
    .then(response => response.json())
    .then(json => createParameters(json)); 
}

function loadFile(id, filename) {
    fetch(filename)
    .then(response => response.json())
    .then(json => addGeoJsonToMap(id, json)); 
}

function addGeoJsonToMap(id, geojson) {
    map.addSource(id, {
        'type': 'geojson',
        'data': geojson
    });
    map.addLayer({
        'id': id,
        'type': 'fill',
        'source': id,
        'layout': {},
        'paint': {
        'fill-color': SEA_COLOR,
        'fill-opacity': 0
        }
    }, findLabelLayer())
}

function addTileLayerToMap(id) {
    
    map.addLayer({
        'id': id,
        'source': 'sealevel',
        'source-layer': id,
        'type': 'fill',
        'layout': {},
        'paint': {
        'fill-color': SEA_COLOR,
        'fill-opacity': 0
        }
    }, findLabelLayer())
}

function findLabelLayer() {
    const layers = map.getStyle().layers;
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            return layers[i].id;
        }
    }
    return undefined;
}

map.on('load', function () {
    map.addSource('sealevel', {
        'type': 'vector',
        'url': 'https://osm.api.nubenum.de/data/sealevel.json'
    });

    addTileLayerToMap('sealevel_100');
    addTileLayerToMap('sealevel_05');
    addTileLayerToMap('sealevel_1');
    addTileLayerToMap('sealevel_2');
    addTileLayerToMap('sealevel_3');
    
    loadMappings();
    
    //loadFile("sealevel_-100", "data/sealevel/sealevel_-15.geojson");
    //loadFile("sealevel_1", "data/sealevel/sealevel_1.geojson");
    //loadFile("sealevel_2", "data/sealevel/sealevel_2.geojson");

    initializeTcs();
});