window.addEventListener("load", initMap, false);
/**
 * Handler for modifying the leaflet map with event data from external files.
 */
let mapHandler = {
    /**
     * Add basic event data to the leaflet map
     */
    addEvents: function(events) {
        //Reset map
        this.clearMap();
        let idTracker = 0;

        //Iterate through events, create a marker layer and add it to the map
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
    /**
     * Removes the marker layers to clear the map
     */
    clearMap: function() {
        this.markerLayers.clearLayers();
    }
};

/**
 * Initialise the map user interface
 */
function initMap() {
    //Create the map and store it in the handler.
    mapHandler.mapObj = L.map("map", {
        zoomDelta: 0.25,
        zoomSnap: 0
    }).setView([0, 0], 3);

    //Set the tile layer
    L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
        {
            minZoom: 2.75,
            attribution:
                'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "mapbox.streets"
        }
    ).addTo(mapHandler.mapObj);

    //Limit the map to 'one' world
    mapHandler.mapObj.setMaxBounds([[-90, -200], [90, 200]]);

    //Create and store the marker layer to add event markers to the handler
    mapHandler.markerLayers = new L.LayerGroup();
    mapHandler.markerLayers.addTo(mapHandler.mapObj);

    //Creating default and active markers, and storing them in the handler
    let defaultMarkerOptions = L.Icon.Default.prototype.options;
    delete defaultMarkerOptions.iconRetinaUrl;
    defaultMarkerOptions.shadowUrl = "../images/marker-shadow.png";

    defaultMarkerOptions.iconUrl = "../images/marker-icon.png";
    mapHandler.defaultIcon = L.icon(defaultMarkerOptions);

    defaultMarkerOptions.iconUrl = "../images/marker-icon-active.png";
    mapHandler.activeIcon = L.icon(defaultMarkerOptions);
}

/**
 * Create a marker based off provided location information, and adding an event listener to set it as the active event
 * @param {*} lat event latitude value
 * @param {*} lng event longitude value
 * @param {*} displayName display name of event from Songkick
 * @param {*} id unique identification of the event, to link it with sidebar
 * @returns Initialised marker as a layer for the map
 */
function placeMarker(lat, lng, displayName, id) {
    //Create a marker at the provided position, with a popup of the event name
    let marker = L.marker([lat, lng]).bindPopup(displayName);

    //Set the first marker as active
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

/**
 * Set a particular event as the active event, triggered by a mouse click on a marker or sidebar.
 * @param {*} id Unique indentification for an event, associated to the marker and sidebar
 * @param {*} marker Marker that triggered the event or undefined
 */
function setActiveEvent(id, marker) {
    //Associate marker if triggered via sidebar
    if (typeof marker === "undefined") {
        marker = mapHandler.markerLayers.getLayers()[id];
    }

    //No need to continue if it is already the active marker
    if (marker === mapHandler.activeMarker) {
        return;
    }

    //Set marker as active, unfocus previous active marker
    marker.openPopup();
    marker.setIcon(mapHandler.activeIcon);
    mapHandler.activeMarker.setIcon(mapHandler.defaultIcon);
    mapHandler.activeMarker = marker;

    //Set sidebar event as active, unfocus previous active event
    document.getElementById("focused").removeAttribute("id");
    document.getElementsByClassName("item")[id].setAttribute("id", "focused");
    document.getElementsByClassName("item")[id].scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}
