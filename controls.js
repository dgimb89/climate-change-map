const SEA_COLOR = '#0b1423';

const coalplants = document.getElementById('coalplants');

var yearSlider = $('#timeline').slider().on('slide', updatePolygons).data('slider');

coalplants.oninput = function() {
    updatePolygons();
}

function updatePolygons() {
    const year = yearSlider.getValue();
    const newOpacity = (parseInt(year) - 2020)/30 * (coalplants.checked ? 0 : 1);
    map.setPaintProperty('sealevel', 'fill-opacity', newOpacity);
    map.setPaintProperty('poles', 'fill-opacity', newOpacity);
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
    })
}

map.on('load', function () {
    loadFile("sealevel", "data/sealevel/sealevel.geojson");
    loadFile("poles", "data/sealevel/poles.geojson");
});