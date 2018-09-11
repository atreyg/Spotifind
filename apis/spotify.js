const rp = require("request-promise");

const spotify = {
    token: null,

    getAuthenticationToken: function() {
        let client_id = "8bebc3251c414793aeabce4ac70ca4ca";
        let client_secret = "e6d775aec93944c9b6d09c47e3965493";

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

    artistSearch: function(artist) {
        let options = createBaseSpotify("/search");
        options.qs = { q: artist, type: "artist" };

        return rp(options).then(
            res => {
                let artists = res.artists.items.map(artist => {
                    return {
                        id: artist.id,
                        name: artist.name,
                        genres: artist.genres,
                        images: artist.images
                    };
                });
                return artists;
            },
            err => {
                if (err.statusCode === 401) {
                    return spotify.getAuthenticationToken().then(res => {
                        spotify.token = res;
                        return spotify.artistSearch(artist);
                    });
                } else {
                    throw err;
                }
            }
        );
    },

    findSongs: function(artistId) {
        let options = createBaseSpotify("/artists/" + artistId + "/top-tracks");
        options.qs.market = "AU";

        return rp(options).then(
            res => {
                if (res.tracks.length < 1) {
                    return;
                }

                let limit = res.tracks.length > 1 ? 1 : res.tracks.length;
                let tracks = [];
                for (let i = 0; i < limit; i++) {
                    tracks.push({
                        name: res.tracks[i].name,
                        artist: res.tracks[i].artists[0].name,
                        preview_url: res.tracks[i].preview_url
                    });
                }
                return tracks;
            },
            err => {
                if (err.statusCode === 401) {
                    return spotify.getAuthenticationToken().then(res => {
                        spotify.token = res;
                        return spotify.findSongs(artistId);
                    });
                } else if(err.statusCode === 429){
                    throw new Error('Too many results! Please make your query more specific');
                }else {
                    throw err;
                }
            }
        );
    },

    similarArtists: function(artistId) {
        let options = createBaseSpotify(
            "/artists/" + artistId + "/related-artists"
        );

        return rp(options).then(
            res => console.log(res),
            err => {
                if (err.statusCode === 401) {
                    return spotify.getAuthenticationToken().then(res => {
                        spotify.token = res;
                        return spotify.similarArtists(artistId);
                    });
                } else {
                    throw err;
                }
            }
        );
    }
};

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