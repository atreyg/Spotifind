window.addEventListener("load", initMap, false);

let mapHandler = {
    addEvents: function(events) {
        //Removes old markers
        this.markerLayers.clearLayers();
        events.forEach(event => {
            let marker = placeMarker(event.lat, event.lng);
            this.markerLayers.addLayer(marker);
        });
    }
};

function initMap() {
    mapHandler.mapObj = L.map("map", {
        zoomDelta: 0.25,
        zoomSnap: 0
    }).setView([0, 0], 3);

    L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
        {
            maxZoom: 10,
            minZoom: 2.75,
            attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox.streets"
        }
    ).addTo(mapHandler.mapObj);

    mapHandler.mapObj.setMaxBounds([[-90, -200], [90, 200]]);
    mapHandler.markerLayers = new L.LayerGroup();
    mapHandler.markerLayers.addTo(mapHandler.mapObj);
}

function placeMarker(lat, lng) {
    return L.marker([lat, lng]);
}
