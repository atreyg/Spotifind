const rp = require("request-promise");

/**
 * TODO REFACTOR SO OPTIONS OBJECT IS CREATED FOR CALLS
 */
const songkick = {
    artistSearch: function(artistName) {
        let req = createArtistObj(artistName);

        return rp(req).then(res => {
            //Array with artist objects for all found
            let artistsFound = res.resultsPage.results.artist;

            if (typeof artistsFound === "undefined") {
                throw new ArtistNotFoundException();
            }

            let artistNames = artistsFound.map(entry => entry.displayName);

            return artistNames;
        });
    },

    areaSearch: function(areaName) {
        let req = createAreaObj(areaName);

        return rp(req).then(res => {
            let areasFound = res.resultsPage.results.location;

            if (typeof areasFound === "undefined") {
                throw new AreaNotFoundException();
            }

            let areaIds = areasFound.map(entry => entry.metroArea.id);

            return areaIds;
        });
    },

    searchByArtist: function(artist, from, to) {
        let req = createSearchObj(from, to);

        for (let i = 0; i < artist.length; i++) {
            req.qs.artist_name = artist[i];
            search(req).then(res => console.log(res));
        }
    },

    searchByArea: function(area, from, to) {
        let req = createSearchObj(from, to);

        for (let i = 0; i < area.length; i++) {
            req.qs.location = "sk:" + area[i];
            search(req).then(res => console.log(res));
        }
    },

    searchByBoth: function(artist, area, from, to) {
        let req = createSearchObj(from, to);

        for (let i = 0; i < artist.length; i++) {
            req.qs.artist_name = artist[i];

            for (let j = 0; j < area.length; j++) {
                req.qs.location = "sk:" + area[j];
                search(req).then(res => console.log(res));
            }
        }
    }
};

function search(options) {
    return rp(options).then(res => {
        let eventsFound = res.resultsPage.results.event;

        if (typeof eventsFound === "undefined") {
            throw new NoEventsException();
        }

        let filteredInformation = eventsFound
            .filter(event => {
                return (
                    event.status === "ok" && event.venue.lat && event.venue.lng
                );
            })
            .map(event => {
                return {
                    displayName: event.displayName,
                    startDate: event.start.date, //yyyy-mm-dd
                    startTime: event.start.time, //hh:mm:ss
                    city: event.location.city,
                    venue: event.venue.displayName,
                    lat: event.venue.lat,
                    lng: event.venue.lng
                };
            });

        return filteredInformation;
    });
}

function createAreaObj(area) {
    let options = createBaseOptionObj("/search/locations.json");
    options.qs.query = area;

    return options;
}

function createArtistObj(artist) {
    let options = createBaseOptionObj("/search/artists.json");
    options.qs.query = artist;

    return options;
}

function createSearchObj(from, to) {
    let options = createBaseOptionObj("/events.json");

    options.qs.max_date = to;
    options.qs.min_date = from;

    return options;
}

function createBaseOptionObj(endpoint) {
    return {
        uri: "https://api.songkick.com/api/3.0" + endpoint,
        qs: {
            apikey: "BuGhC5QiUFzro5h3"
        },
        headers: {
            "User-Agent": "Request-Promise"
        },
        json: true
    };
}

function ArtistNotFoundException() {
    this.message = "Could not find the artist searched for";
    this.toString = () => this.message;
}

function NoEventsException() {
    this.message = "No events found for the search parameters";
    this.toString = () => this.message;
}

function AreaNotFoundException() {
    this.message = "Could not find the area searched for";
    this.toString = () => this.message;
}

module.exports = songkick;
