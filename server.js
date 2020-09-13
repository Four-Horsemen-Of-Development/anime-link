"use strict";
require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 3000;
const superAgent = require("superagent");
const app = express();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverRide = require("method-override");
app.use(methodOverRide("_method"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));

app.get("/random", (req, res) => {
    res.render("./pages/random-animes");
});

app.get("/details/:id", (req, res) => {
    const url = `https://api.jikan.moe/v3/anime/${req.params.id}`;

    superAgent.get(url).then(({ body }) => {
        let anime = new Anime(body);
        console.log(anime);
        res.render("./pages/details", { anime });
    });
});

function Anime(anime) {
    let genres = anime.genres.map((genre) => genre.name);

    this.title = anime.title;
    this.image_url = anime.image_url;
    this.mal_id = anime.mal_id;
    this.status = anime.status;
    this.airing = anime.airing;
    this.broadcast = anime.broadcast;
    this.aired = anime.aired.string;
    this.duration = anime.duration;
    this.rating = anime.rating;
    this.score = anime.score;
    this.popularity = anime.popularity;
    this.description = anime.synopsis;
    this.genres = genres;
    this.episodes = anime.episodes;
    this.type = anime.type;
}

client.connect().then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
});
