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
                throw new Exception("Could not find the artist searched for");
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
                throw new Exception("Could not find the area searched for");
            }

            let areaIds = areasFound.map(entry => entry.metroArea.id);

            return areaIds;
        });
    },

    searchByArtist: function(artist, from, to) {
        let req = createSearchObj(from, to);
        let promiseChain = [];
        let eventsFound = [];

        for (let i = 0; i < artist.length; i++) {
            req.qs.artist_name = artist[i];
            let promise = search(req).then(res => {
                eventsFound = eventsFound.concat(res);
            });
            promiseChain.push(promise);
        }

        return Promise.all(promiseChain).then(() => {
            if (eventsFound.length === 0) {
                throw new Exception("No events found for the artist");
            }
            return eventsFound;
        });
    },

    searchByArea: function(area, from, to) {
        let req = createSearchObj(from, to);
        let promiseChain = [];
        let eventsFound = [];

        for (let i = 0; i < area.length; i++) {
            req.qs.location = "sk:" + area[i];
            let promise = search(req).then(res => {
                eventsFound = eventsFound.concat(res);
            });
            promiseChain.push(promise);
        }

        return Promise.all(promiseChain).then(() => {
            if (eventsFound.length === 0) {
                throw new Exception("No events found for the area");
            }
            return eventsFound;
        });
    },

    searchByBoth: function(artist, area, from, to) {
        return this.searchByArtist(artist).then(res => {
            let areaFiltered = res.filter(event => {
                return area.includes(event.areaId);
            });

            if (areaFiltered.length === 0) {
                throw new Exception(
                    "No events found for the search parameters"
                );
            }
            return areaFiltered;
        });
    }
};

function search(options) {
    return rp(options).then(res => {
        let eventsFound = res.resultsPage.results.event;

        if (typeof eventsFound === "undefined") {
            //throw new Exception("No events found for the search parameters");
            return [];
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
                    areaId: event.venue.metroArea.id,
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

function Exception(message) {
    this.message = message;
    this.toString = () => this.message;
}

module.exports = songkick;
