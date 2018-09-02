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

        rp(options)
            .then(resp => {
                //Array with artist objects for all found
                let artistsFound = resp.resultsPage.results.artist;
                //Artist ids of found artists
                let artistIds = artistsFound.map(entry => entry.id);
                return artistIds;
            })
            .then(artistIds => {
                /**
                 * !!Add support for multiple artists
                 */
                options.uri =
                    baseUrl + `/artists/${artistIds[0]}/calendar.json`;
                delete options.qs.query;
                return rp(options);
            })
            .then(res => {
                let eventsFound = res.resultsPage.results.event;
                console.log(eventsFound);
                return eventsFound[0];
            })
            .catch(err => {
                console.log(err);
            });
    }
};

module.exports = songkick;
