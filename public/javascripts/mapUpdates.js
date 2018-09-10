window.addEventListener("load", initMap, false);

let mapHandler = {
    addEvents: function(events) {
        this.clearMap();

        let idTracker = 0;
        for (let artistGroup in events) {
            let artistEvents = events[artistGroup].events;
            for (let i = 0; i < artistEvents.length; i++) {
                let marker = placeMarker(
                    artistEvents[i].lat,
                    artistEvents[i].lng,
                    artistEvents[i].displayName,
                    idTracker
                );
                this.markerLayers.addLayer(marker);
                idTracker++;
            }
        }
    },
    clearMap: function() {
        this.markerLayers.clearLayers();
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

    //Creating markers
    let defaultMarkerOptions = L.Icon.Default.prototype.options;
    delete defaultMarkerOptions.iconRetinaUrl;
    defaultMarkerOptions.shadowUrl = "../images/marker-shadow.png";

    defaultMarkerOptions.iconUrl = "../images/marker-icon.png";
    mapHandler.defaultIcon = L.icon(defaultMarkerOptions);

    defaultMarkerOptions.iconUrl = "../images/marker-icon-active.png";
    mapHandler.activeIcon = L.icon(defaultMarkerOptions);
}

function placeMarker(lat, lng, displayName, id) {
    let marker = L.marker([lat, lng]).bindPopup(displayName);

    if (id == 0) {
        marker.setIcon(mapHandler.activeIcon);
        mapHandler.activeMarker = marker;
    } else {
        marker.setIcon(mapHandler.defaultIcon);
    }

    marker.on("click", function(e) {
        setActiveEvent(id, e.sourceTarget);
    });

    return marker;
}

function setActiveEvent(id, marker) {
    if (typeof marker === "undefined") {
        marker = mapHandler.markerLayers.getLayers()[id];
    }

    if (marker === mapHandler.activeMarker) {
        return;
    }

    marker.openPopup();
    marker.setIcon(mapHandler.activeIcon);
    mapHandler.activeMarker.setIcon(mapHandler.defaultIcon);
    mapHandler.activeMarker = marker;

    document.getElementById("focused").removeAttribute("id");
    document.getElementsByClassName("item")[id].setAttribute("id", "focused");
}
