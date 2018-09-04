const rp = require("request-promise");

const baseUrl = "https://api.songkick.com/api/3.0";
/**
 * TODO REFACTOR SO OPTIONS OBJECT IS CREATED FOR CALLS
 */
const songkick = {
    searchArtist: function(artistName) {
        const options = {
            uri: baseUrl + "/search/artists.json",
            qs: {
                apikey: "BuGhC5QiUFzro5h3",
                query: artistName
            },
            headers: {
                "User-Agent": "Request-Promise"
            },
            json: true
        };

        return rp(options)
            .then(resp => {
                //Array with artist objects for all found
                let artistsFound = resp.resultsPage.results.artist;

                if (typeof artistsFound === "undefined") {
                    throw new ArtistNotFoundException();
                }

                //Artist ids of found artists
                let artistNames = artistsFound.map(entry => entry.displayName);

                /**
                 * !!Add support for multiple artists
                 */

                options.uri = baseUrl + `/events.json`;
                delete options.qs.query;
                options.qs.artist_name = artistNames[0];

                return rp(options);
            })
            .then(res => {
                let eventsFound = res.resultsPage.results.event;

                if (typeof eventsFound === "undefined") {
                    throw new NoEventsException();
                }

                let filteredInformation = eventsFound
                    .filter(event => {
                        return (
                            event.status === "ok" &&
                            event.venue.lat &&
                            event.venue.lng
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
};

function ArtistNotFoundException() {
    this.message = "Could not find the artist searched for";
    this.toString = () => this.message;
}

function NoEventsException() {
    this.message = "The artist has no events coming up";
    this.toString = () => this.message;
}

module.exports = songkick;
