"use strict";
require("dotenv").config();

const express = require("express");
const PORT = process.env.PORT || 3000;
const superAgent = require("superagent");
const app = express();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverRide = require("method-override");
const { log, error } = require("console");
let localStorage = null;
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
}
app.use(methodOverRide("_method"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));

app.get("/", mainHandler);
app.get("/login", loginHandler);
app.post("/signup", signupHandler);
app.post("/signin", signinHandler);
app.get("/logout", logoutHandler);
app.get("/quote", quoteHandler);
app.get("/search", searchRender);
app.post("/searchShow", searchHandler);

app.get("/random", (req, res) => {
    res.render("./pages/random-animes");
});
app.get("/user_list", (req, res) => {
    let safeValue = [localStorage.getItem("userid")];
    console.log(safeValue);
    const getList = `select * from useranime ua 
            JOIN users as u on u.user_id = ua.user_id 
            JOIN animes as a on a.mal_id = ua.mal_id
            WHERE $1 = ua.user_id
            `;
    client.query(getList, safeValue).then(({ rows }) => {
        res.render("./pages/userlist", { animeList: rows, localStorage });
    });
    // res.render("./pages/random-animes");
});

app.get("/details/:id", (req, res) => {
    const url = `https://api.jikan.moe/v3/anime/${req.params.id}`;

    superAgent.get(url).then(async ({ body }) => {
        let anime = new Anime(body);
        let recomndetionUrl = `https://api.jikan.moe/v3/anime/${req.params.id}/recommendations`;
        let { body: result } = await superAgent.get(recomndetionUrl);
        // console.log(result);
        // res.send(result.recommendations);
        res.render("./pages/details", { anime, localStorage, result });
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
    this.rank = anime.rank;
    this.scored_by = anime.scored_by;
}
app.post("/updateUserList", (req, res) => {
    console.log("/updateUserList", req.body);

    let safeValuesOfAnime = [
        req.body.mal_id,
        req.body.title,
        req.body.image_url,
        req.body.broadcast.split(" ")[0].slice(0, -1).toUpperCase(),
    ];
    const insertAnime = `INSERT INTO animes values ($1,$2,$3,$4)`;
    client
        .query(insertAnime, safeValuesOfAnime)
        .then(({ rows }) => {
            // console.log(rows);
            updateAnimeInlist(req);
        })
        .catch((error) => {
            updateAnimeInlist(req);
        });
});

function updateAnimeInlist(req) {
    let animeId = [req.body.mal_id];
    console.log("checkIfAnimeExistcheckIfAnimeExistcheckIfAnimeExist");
    const getList = `select * from useranime ua 
            JOIN users as u on u.user_id = ua.user_id 
            JOIN animes as a on a.mal_id = ua.mal_id
            WHERE $1 = ua.mal_id
            `;
    client
        .query(getList, animeId)
        .then(({ rowCount }) => {
            console.log("rowCountrowCountrowCountrowCountrowCount", rowCount);
            if (rowCount === 0) {
                insertAnimeList(req);
            } else {
                const updateSafeValues = [req.body.user_id, req.body.mal_id];
                const update = `
                        UPDATE useranime SET ${req.body.option} = 
                        CASE WHEN (select ${req.body.option} from useranime where mal_id = $2) = true then false
                        ELSE true END
                        WHERE user_id = $1 and mal_id = $2;
                        `;
                client
                    .query(update, updateSafeValues)
                    .then()
                    .catch((error) => {
                        console.log(error);
                    });
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function insertAnimeList(req) {
    console.log("inseeeeeeeeeeeeeert");
    let safeValuesOfList = [req.body.mal_id, req.body.user_id, true];
    console.log(
        "safeValuesOfList safeValuesOfListsafeValuesOfList",
        safeValuesOfList
    );
    const insertIntoAnimeList = `INSERT INTO useranime (mal_id,user_id,${req.body.option}) values ($1,$2,$3)`;
    client
        .query(insertIntoAnimeList, safeValuesOfList)
        .then((result) => {
            console.log("inseeeeeeeeeeeert", result);
        })
        .catch((error) => {
            console.log(error);
        });
}
app.get("/notification", async (req, res) => {
    let getnotification = `select * from useranime ua
    JOIN users as u on u.user_id = ua.user_id
    JOIN animes as a on a.mal_id = ua.mal_id
    where ua.following = true and  trim(to_char(current_timestamp, 'DAY'))  = a.broadcast
    `;
    // let getnotification = `select trim(to_char(current_timestamp, 'DAY'));
    // `;
    let { rows } = await client.query(getnotification);
    res.send(rows);
});
function signupHandler(req, res) {
    let { userName, password } = req.body;
    let safeValues = [userName];
    let sql = "SELECT username FROM users WHERE username=$1;";
    client.query(sql, safeValues).then((results) => {
        console.log(results.rows);
        if (results.rowCount > 0) {
            console.log("username already exists"); //TODO: add alerts
            res.redirect("/login");
        } else {
            let safeValues2 = [userName, password];
            let sql2 =
                "insert into users (username ,password) values ($1 , $2);";
            client.query(sql2, safeValues2).then(() => {
                console.log("user added");
                res.redirect("/login");
            });
        }
    });
}
function signinHandler(req, res) {
    let { userName, password } = req.body;
    let safeValues = [userName, password];
    let sql =
        "SELECT username,user_id FROM users WHERE username=$1 AND password=$2;";
    client.query(sql, safeValues).then((results) => {
        console.log(results.rows);
        if (results.rowCount > 0) {
            let user_id = results.rows[0].user_id;
            localStorage.setItem("username", userName);
            localStorage.setItem("userid", user_id);
            res.redirect("/login");
        } else {
            console.log("login unsuccessful");
            res.redirect("/login");
        }
    });
}

function quoteHandler(req, res) {
    let url = "https://animechanapi.xyz/api/quotes/random";
    superAgent.get(url).then((result) => {
        // res.send(result.body.data[0].quote);
        res.send(localStorage.getItem("userid"));
    });
}

function searchRender(req, res) {
    res.render("pages/search");
}

function searchHandler(req, res) {
    let { searchQuery, genre, rated, status } = req.body;
    let url = `https://api.jikan.moe/v3/search/anime?q=${searchQuery}${genre}${rated}${status}&limit=30`;
    superAgent.get(url).then((result) => {
        console.log(result.body);
    });
}

function mainHandler(req, res) {
    let date = new Date();
    let season = getSeason(date);
    let url = `https://api.jikan.moe/v3/season/${date.getFullYear()}/${season}`;
    superAgent(url)
        .then((result) => {
            let animeArr = [];
            for (let i = 0; i < 8; i++) {
                animeArr.push({
                    title: result.body.anime[i].title,
                    image_url: result.body.anime[i].image_url,
                    id: result.body.anime[i].mal_id,
                });
            }

            res.render("pages/index", {
                animeArr: animeArr,
                localUsername: localStorage.getItem("username"),
            });
        })
        .catch(() => {
            res.send("did not work");
        });
}

function getSeason(date) {
    switch (date.getMonth()) {
        case 3:
        case 4:
        case 5:
            return "spring";
            break;
        case 6:
        case 7:
        case 8:
            return "summer";
            break;
        case 9:
        case 10:
        case 11:
            return "autumn";
            break;
        case 0:
        case 1:
        case 2:
            return "winter";
            break;
    }
}
function loginHandler(req, res) {
    if (localStorage.getItem("username") != null) {
        res.redirect("/");
        console.log("logged in");
    } else {
        res.render("pages/login");
        console.log("not logged in");
    }
}
function logoutHandler(req, res) {
    localStorage.clear();
    res.redirect("/");
}

client.connect().then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
});
