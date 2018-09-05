var express = require("express");
var router = express.Router();

const songkick = require("../apis/songkick.js");

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index");
});

/* Handle search requests */
router.post("/", (req, resp, next) => {
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
            })
            .then(res => resp.send(res))
            .catch(e => resp.send(e));
    } else if (area !== "") {
        songkick
            .areaSearch(area)
            .then(res => songkick.searchByArea(res, from, to))
            .then(res => resp.send(res))
            .catch(e => resp.send(e));
    } else if (artist !== "") {
        songkick
            .artistSearch(artist)
            .then(res => songkick.searchByArtist(res, from, to))
            .then(res => resp.send(res))
            .catch(e => resp.send(e));
    }
});

module.exports = router;
