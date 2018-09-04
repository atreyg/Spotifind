var express = require("express");
var router = express.Router();

const songkick = require("../apis/songkick.js");

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index");
});

/* Handle search requests */
router.post("/", (req, res, next) => {
    console.log("received post");

    let { artist, area, from, to } = req.body;

    /**
     * TODO : questionable
     */

    if (artist !== "" && area !== "") {
        songkick
            .artistSearch(artist)
            .then(res => {
                artist = res;
                return songkick.areaSearch(area);
            })
            .then(res => {
                area = res;
                return songkick.searchByBoth(artist, area, from, to);
            });
    } else if (area !== "") {
        songkick.areaSearch(area).then(res => {
            area = res;
            return songkick.searchByArea(area, from, to);
        });
    } else if (artist !== "") {
        songkick.artistSearch(artist).then(res => {
            artist = res;
            console.log(artist);
            return songkick.searchByArtist(artist, from, to);
        });
    }
});

module.exports = router;
