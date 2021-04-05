const SEA_COLOR = '#001234';

const coalplants = document.getElementById('coalplants');

var yearSlider = $('#timeline').slider().on('change', updatePolygons).data('slider');

coalplants.oninput = function() {
    updatePolygons();
}

function updatePolygons() {
    const year = yearSlider.getValue();
    map.setPaintProperty('sealevel_100', 'fill-opacity', year <= 2020 || coalplants.checked ? 1 : 0);
    map.setPaintProperty('sealevel_1', 'fill-opacity', year > 2020 && year <= 2040 && !coalplants.checked ? 1 : 0);
    map.setPaintProperty('sealevel_2', 'fill-opacity', year > 2040 && !coalplants.checked ? 1 : 0);
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
    addTileLayerToMap('sealevel_1');
    addTileLayerToMap('sealevel_2');
    
    updatePolygons();
    
    //loadFile("sealevel_-100", "data/sealevel/sealevel_-15.geojson");
    //loadFile("sealevel_1", "data/sealevel/sealevel_1.geojson");
    //loadFile("sealevel_2", "data/sealevel/sealevel_2.geojson");
    //loadFile("poles", "data/sealevel/poles.geojson");
});