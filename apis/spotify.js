//Library for creating requests with promise functionality
const rp = require("request-promise");

/**
 * Spotify object with methods to make required API calls
 */
const spotify = {
    //Authentication token
    token: null,

    /**
     * Authenticates Spotify API calls using Spotifind's client id and secret
     * @returns Authentication token to make calls
     */
    getAuthenticationToken: function() {
        let client_id = "8bebc3251c414793aeabce4ac70ca4ca";
        let client_secret = "e6d775aec93944c9b6d09c47e3965493";

        //Object to make the request for access token, encodes id and secret in base64
        let options = {
            method: "POST",
            uri: "https://accounts.spotify.com/api/token",
            form: {
                grant_type: "client_credentials"
            },
            headers: {
                Authorization:
                    "Basic " +
                    new Buffer(client_id + ":" + client_secret).toString(
                        "base64"
                    )
            },
            json: true
        };

        return rp(options).then(res => res.access_token);
    },

    /**
     * Search for an artist on Spotify with a text input
     * @param {string} artist Name of artist
     * @returns {array} Array of artist objects (including id, name, genres, and image) that match search
     */
    artistSearch: function(artist) {
        //Initialise object to use for artist search
        let options = createBaseSpotify("/search");
        options.qs = { q: artist, type: "artist" };

        //Returns a promise of the search
        return rp(options).then(
            res => {
                let artists = res.artists.items.map(artist => {
                    //If an image source isn't present use the default image source
                    let imgSrc = artist.images[0]
                        ? artist.images[0].url
                        : "/images/default-image.jpg";

                    return {
                        id: artist.id,
                        name: artist.name,
                        genres: artist.genres,
                        image: imgSrc
                    };
                });
                return artists;
            },
            //Called function passed in incase error is related to token timeout
            err => handleSpotifyErrors(err, spotify.artistSearch, artist)
        );
    },

    /**
     * Find the most popular track for an array of artists
     * @param {array} artistNames Array of artist names
     * @returns {Promise} Promise that resolves to an array with elements of -1 (no track found)
     *                    or object holding track name and preview url
     */
    findTracks: function(artistNames) {
        //Create promise chain for each artist search
        let promiseChain = [];
        artistNames.forEach(artist => {
            promiseChain.push(spotify.artistSearch(artist));
        });

        return Promise.all(promiseChain)
            .then(res => trackSearches(res, artistNames))
            .then(
                res => topTrackByArtist(res),
                err => handleSpotifyErrors(err, spotify.findTracks, artistNames)
            );
    },

    similarArtists: function(artistId) {
        let options = createBaseSpotify(
            "/artists/" + artistId + "/related-artists"
        );

        return rp(options).then(
            res => res.artists.map(artist => artist.name),
            err => handleSpotifyErrors(err, spotify.similarArtists, artistId)
        );
    }
};

/**
 * Common function to handle the errors that could be received from the Spotify API
 * @param {object} err error object received
 * @param {function} funcCall function to be called after reauthentication
 * @param {*} param parameter to call 'funcCall' with
 */
function handleSpotifyErrors(err, funcCall, param) {
    //Authentication error
    if (err.statusCode === 401) {
        //Reauthenticates, stores the token, then recalls API call that was originally undertaken
        return spotify.getAuthenticationToken().then(res => {
            spotify.token = res;
            return funcCall(param);
        });
    }
    //Exceeding the rate limit of the Spotify API
    else if (err.statusCode === 429) {
        throw new Error(
            "Too many results! Please make your query more specific"
        );
    } else {
        throw err;
    }
}

/**
 * Gets most popular tracks for each artist searched for
 * @param {array} res array of artists found with spotify.artistSearch
 * @param {array} artistArray names to compare with results to find correct artist
 * @returns {Promise} Promise that resolves to top tracks or -1, depending on if artist is found
 */
function trackSearches(res, artistArray) {
    let secondaryChain = [];

    for (let i = 0; i < res.length; i++) {
        let artist = res[i];
        //If artist not found or name doesnt match, include placeholder
        if (artist.length === 0) {
            secondaryChain.push(Promise.resolve(-1));
        } else {
            //Find correct search result by exact comparison of name
            let names = artist.map(entry => entry.name);
            let index = names.indexOf(artistArray[i]);
            if (index === -1) {
                secondaryChain.push(Promise.resolve(-1));
            }
            //If artist is found, search for their top tracks
            let options = createBaseSpotify(
                "/artists/" + artist[index].id + "/top-tracks"
            );
            options.qs.market = "AU";

            secondaryChain.push(rp(options));
        }
    }

    return Promise.all(secondaryChain);
}

/**
 * Finds the top track from the result of the top tracks query for a given artist
 * @param {array} trackArray array of track objects
 * @returns Object with name and preview url of the top track
 */
function topTrackByArtist(trackArray) {
    return trackArray.map(artist => {
        if (artist === -1 || artist.tracks.length === 0) {
            return -1;
        }

        return {
            name: artist.tracks[0].name,
            preview_url: artist.tracks[0].preview_url
        };
    });
}

/**
 * Helper function to create an object for making requests to Spotify API with request
 * @param {string} endpoint
 * @returns {object} Object to use with request call
 */
function createBaseSpotify(endpoint) {
    return {
        uri: "https://api.spotify.com/v1" + endpoint,
        qs: {},
        headers: {
            "User-Agent": "Request-Promise",
            Authorization: "Bearer " + spotify.token
        },
        json: true
    };
}

module.exports = spotify;
