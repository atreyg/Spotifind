//Library for creating requests with promise functionality
const rp = require("request-promise");

/**
 * Songkick object with methods to make required API calls
 */
const songkick = {
    /**
     * Search for artist based on artist name in the Songkick database
     * @param {string} artistName name of the artist
     * @returns Promise that resolves to an array of artist names
     */
    artistSearch: function(artistName) {
        //Building query to request as per specifications
        let req = createBaseOptionObj("/search/artists.json");
        req.qs.query = artistName;

        return rp(req).then(res => {
            //Array with artist objects for all found
            let artistsFound = res.resultsPage.results.artist;

            //Return an empty array if none found, or an array of artist names that match search
            if (typeof artistsFound === "undefined") {
                return [];
            }

            return artistsFound.map(entry => entry.displayName);
        });
    },

    /**
     * Search for area based on area name in the Songkick database
     * @param {string} areaName name of the area
     * @returns Promise that resolves to an array of area objects containing id and location information
     */
    areaSearch: function(areaName) {
        //Building query to request as per specifications
        let req = createBaseOptionObj("/search/locations.json");
        req.qs.query = areaName;

        return rp(req).then(res => {
            //Array with area objects for all found
            let areasFound = res.resultsPage.results.location;

            //Return an empty array if not found, or a filtered selection of area information
            if (typeof areasFound === "undefined") {
                return [];
            }

            return areasFound.map(entry => {
                let generalArea = constructGeneralArea(entry.metroArea);

                return {
                    id: entry.metroArea.id,
                    city: entry.city.displayName,
                    widerArea: generalArea,
                    state: "nosearch"
                };
            });
        });
    },

    /**
     * Search for events by artist, including filters with from and to dates
     * @param artist array of artist objects to search for
     * @param from earliest date to search for an event
     * @param to latest date to search for an event
     * @return Promise which resolves to an array with event information
     */
    searchByArtist: function(artist, from, to) {
        //Building query to request as per specifications
        let req = createBaseOptionObj("/events.json");
        req.qs.min_date = from;
        req.qs.max_date = to;

        //Iterate through artists and search for events. Store results from all searches into 'eventsFound.
        //Add promises to an array to ensure all complete before information is properly returned.
        let promiseChain = [];
        let eventsFound = [];
        for (let i = 0; i < artist.length; i++) {
            //Additional request info required to search for a particular artist
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

    /**
     * Search for events by area, including filters with from and to dates
     * @param area array of area objects to search for
     * @param from earliest date to search for an event
     * @param to latest date to search for an event
     * @return Promise which resolves to an array with event information
     */
    searchByArea: function(area, from, to) {
        //Building query to request as per specifications
        let req = createBaseOptionObj("/events.json");
        req.qs.min_date = from;
        req.qs.max_date = to;

        //Iterate through artists and search for events. Store results from all searches into 'eventsFound.
        //Add promises to an array to ensure all complete before information is properly returned.
        let promiseChain = [];
        let eventsFound = [];
        for (let i = 0; i < area.length; i++) {
            //Additional request info required to search for a particular artist
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

    /**
     * Search for events based on both artist and area parameters.
     * @param artist array of artist objects to search for
     * @param area array of area objects to search for
     * @param from earliest date to search for an event
     * @param to latest date to search for an event
     * @return Promise which resolves to an array with event information
     */
    searchByBoth: function(artist, area, from, to) {
        //Store area ids to include in results
        let areasForSearch = area.map(item => item.id);

        //Search for the artists using searchByArtist function, and filter results by area id
        return this.searchByArtist(artist).then(res => {
            let areaFiltered = res.filter(event => {
                return areasForSearch.includes(event.areaId);
            });

            if (areaFiltered.length === 0) {
                throw new Error(
                    "No events found for the search parameters. Try making them less specific."
                );
            }
            return areaFiltered;
        });
    }
};

/**
 * Helper function which is utilised in all three control flows through this program, to actually query Songkick for event information.
 * @param {Object} options object with parameters set to query the Songkick API with the request library.
 * @param {string} grouping string with artist name to classify events under, or undefined
 */
function search(options, grouping) {
    //Carry out the request, but include grouping data in the resulting promise.
    return Promise.all([rp(options), Promise.resolve(grouping)]).then(res => {
        let eventsFound = res[0].resultsPage.results.event;

        if (typeof eventsFound === "undefined") {
            return [];
        }

        let filteredInformation = eventsFound
            //Ensure sufficient data present to be useful in this application or exclude event
            .filter(event => {
                return (
                    event.status === "ok" &&
                    event.venue.lat &&
                    event.venue.lng &&
                    event.performance[0]
                );
            })
            .map(event => {
                //If an artist is selected in the search query, grouping is pre-specified
                //Otherwise classify the event under the headliner
                let artistGroup;
                if (typeof res[1] !== "undefined") {
                    artistGroup = res[1];
                } else {
                    artistGroup = event.performance[0].displayName;
                }

                //Required data to provide useful information to users on client side
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

/**
 * Helper to create a nice viewable string of the wider area of an event
 * @param {object} place subobject of metroArea in area search
 * @returns String representation of a broader area
 */
function constructGeneralArea(place) {
    let construct = place.displayName;

    if (place.state) {
        construct += ", " + place.state.displayName;
    }
    construct += ", " + place.country.displayName;

    return construct;
}

/**
 * Helper function to create an object for making requests to Songkick API with request
 * @param {string} endpoint
 * @returns {object} Object to use with request call
 */
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
