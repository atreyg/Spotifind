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
                return [];
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
                return [];
            }

            let areaIds = areasFound.map(entry => {
                let generalArea = entry.metroArea.displayName;

                if (entry.metroArea.state) {
                    generalArea += ", " + entry.metroArea.state.displayName;
                }

                generalArea += ", " + entry.metroArea.country.displayName;

                return {
                    id: entry.metroArea.id,
                    city: entry.city.displayName,
                    widerArea: generalArea,
                    state: "nosearch"
                };
            });

            return areaIds;
        });
    },

    searchByArtist: function(artist, from, to) {
        let req = createSearchObj(from, to);
        let promiseChain = [];
        let eventsFound = [];

        for (let i = 0; i < artist.length; i++) {
            req.qs.artist_name = artist[i].songkickName;
            let promise = search(req, artist[i].songkickName).then(res => {
                eventsFound = eventsFound.concat(res);
            });
            promiseChain.push(promise);
        }

        return Promise.all(promiseChain).then(() => {
            if (eventsFound.length === 0) {
                throw new Error("No events found for the artist");
            }
            return eventsFound;
        });
    },

    searchByArea: function(area, from, to) {
        let req = createSearchObj(from, to);
        let promiseChain = [];
        let eventsFound = [];

        for (let i = 0; i < area.length; i++) {
            req.qs.location = "sk:" + area[i].id;
            let promise = search(req).then(res => {
                eventsFound = eventsFound.concat(res);
            });
            promiseChain.push(promise);
        }

        return Promise.all(promiseChain).then(() => {
            if (eventsFound.length === 0) {
                throw new Error("No events found for the area");
            }
            return eventsFound;
        });
    },

    searchByBoth: function(artist, area, from, to) {
        let areasForSearch = area.map(item => item.id);
        return this.searchByArtist(artist).then(res => {
            let areaFiltered = res.filter(event => {
                return areasForSearch.includes(event.areaId);
            });

            if (areaFiltered.length === 0) {
                throw new Error("No events found for the search parameters");
            }
            return areaFiltered;
        });
    }
};

function search(options, grouping) {
    return Promise.all([rp(options), Promise.resolve(grouping)]).then(res => {
        let eventsFound = res[0].resultsPage.results.event;

        if (typeof eventsFound === "undefined") {
            return [];
        }

        let filteredInformation = eventsFound
            .filter(event => {
                return (
                    event.status === "ok" && event.venue.lat && event.venue.lng
                );
            })
            .map(event => {
                let artistGroup;
                if (typeof res[1] !== "undefined") {
                    artistGroup = res[1];
                } else {
                    artistGroup = event.performance[0].displayName;
                }

                return {
                    id: event.id,
                    displayName: event.displayName,
                    grouping: artistGroup,
                    startDate: event.start.date, //yyyy-mm-dd
                    city: event.location.city,
                    venue: event.venue.displayName,
                    areaId: event.venue.metroArea.id,
                    lat: event.venue.lat,
                    lng: event.venue.lng,
                    uri: event.uri
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

function createSimilarArtistsObj(artist) {
    let options = createBaseOptionObj(
        "/artists/" + artist + "/similar_artists.json"
    );
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

module.exports = songkick;
