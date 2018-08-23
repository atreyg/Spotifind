var express = require("express");
var router = express.Router();

const songkick = require("../apis/songkick.js");

/* GET home page. */
router.get("/", (req, res, next) => {
    res.render("index", { title: "Express", type: "get" });
});

/* Handle search requests */
router.post("/", (req, res, next) => {
    //res.render("index", { title: "Express", type: "post" });
    let { artist, venue, area } = req.body;
    res.json(songkick.searchArtist(artist));
});

module.exports = router;
