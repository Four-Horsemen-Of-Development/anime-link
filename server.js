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
let message = "";
let localStorage = null;
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require("node-localstorage").LocalStorage;
    localStorage = new LocalStorage("./scratch");
}
app.use(methodOverRide("_method"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));

app.get('/', mainHandler);
app.get('/login', loginHandler)
app.post('/signup', signupHandler);
app.post('/signin', signinHandler);
app.get('/logout', logoutHandler);
app.get('/trending', trendingHandler)
app.get('/search', searchRender);
app.post('/searchShow', searchHandler);
app.put('/passwordChange/:userid', passwordChanger);

app.get("/random", async (req, res) => {
    let { rows: notifications } = await getnotification();
    res.render("./pages/random-animes", { localStorage, notifications, localUsername: localStorage.getItem("username") });
});
app.get("/user_list", async (req, res) => {
    let { rows: notifications } = await getnotification();
    if (localStorage.getItem("username") == null) {
        res.redirect("/login");
        console.log("Not logged in");
    } else {
        let safeValue = [localStorage.getItem("userid")];
        console.log(safeValue);
        const getList = `select * from useranime ua 
                JOIN users as u on u.user_id = ua.user_id 
                JOIN animes as a on a.mal_id = ua.mal_id
                WHERE $1 = ua.user_id
                `;
        client.query(getList, safeValue).then(async ({ rows }) => {
            let { rows: notifications } = await getnotification();
            res.render("./pages/userlist", { animeList: rows, localStorage, notifications, localUsername: localStorage.getItem("username"), localUserId: localStorage.getItem("userid") });
        });
        // res.render("./pages/random-animes");
    }
});

app.get("/details/:id", async (req, res) => {
    const url = `https://api.jikan.moe/v3/anime/${req.params.id}`;
    let { rows: notifications } = await getnotification();

    superAgent.get(url).then(async ({ body }) => {
        let anime = new Anime(body);
        // let recomndetionUrl = `https://api.jikan.moe/v3/anime/${req.params.id}/recommendations`;
        // let { body: result } = await superAgent.get(recomndetionUrl);
        // console.log(result);
        // res.send(result.recommendations);
        res.render("./pages/details", { anime, localStorage, notifications, localUsername: localStorage.getItem("username") });

    }).catch((error)=>{
        res.send('details');
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
            res.redirect(req.get("referer"));
        })
        .catch((error) => {
            updateAnimeInlist(req);
            res.redirect(req.get("referer"));
        });
});

function updateAnimeInlist(req, res) {
    let animeId = req.body.mal_id;
    let userId = req.body.user_id;
    let safeValue = [animeId, userId];
    console.log("Check If Anime Exists");
    const getList = `select * from useranime ua 
            JOIN users as u on u.user_id = ua.user_id 
            JOIN animes as a on a.mal_id = ua.mal_id
            WHERE ua.mal_id = $1 and ua.user_id = $2;
            `;
    client
        .query(getList, safeValue)
        .then(({ rowCount }) => {
            console.log("Row count :", rowCount);
            if (rowCount === 0) {
                console.log('Anime does not exist for this user');
                insertAnimeList(req);
            } else {
                const updateSafeValues = [req.body.user_id, req.body.mal_id];
                console.log('Option : ', req.body.option);
                const update = `
                        UPDATE useranime SET ${req.body.option} = 
                        CASE WHEN (select ${req.body.option} from useranime where mal_id = $2 and user_id = $1) = true then false
                        ELSE true END
                        WHERE user_id = $1 and mal_id = $2;
                        `;
                client
                    .query(update, updateSafeValues)
                    .then((data) => {
                        res.redirect(req.get("referer"));
                    })
                    .catch((error) => {
                        // console.log(error);
                    });
            }
        })
        .catch((error) => {
            console.log(error);
        });
}

function trendingHandler(req, res) {
    let country = localStorage.getItem('country')
    let safeValue = [country]
    let sql = `SELECT COUNT(*) FROM users
    where country = $1;`
    client.query(sql, safeValue).then((result) => {
        let countryUsersCount = result.rows[0].count;
        let sql2 = `select ua.mal_id from useranime ua
        JOIN users as u on u.user_id = ua.user_id
        JOIN animes as a on a.mal_id = ua.mal_id
        where ua.is_watching = true AND u.country = $1
        `;
        client.query(sql2, safeValue).then(results => {
            let resultsArr = results.rows;
            let counts = resultsArr.reduce(function (obj, val) {
                obj[val.mal_id] = (obj[val.mal_id] || 0) + 1;
                return obj;
            }, {});
            let keys = Object.keys(counts);
            let arrarr = [];
            keys.forEach(item => {
                if (counts[item] > countryUsersCount/3) {
                    let obj = {}
                    obj[item] = counts[item];
                    arrarr.push(obj)
                }
            });
            let result = arrarr.sort((a, b) => {
                a = Object.values(a)[0];
                b = Object.values(b)[0];
                if (a > b) {
                    return -1;
                }
                if (a < b) {
                    return 1;
                }
                return 0;
            });
            
            res.send(result);
        })
    })

}

function insertAnimeList(req) {
    let safeValuesOfList = [req.body.mal_id, req.body.user_id, true];
    const insertIntoAnimeList = `INSERT INTO useranime (mal_id,user_id,${req.body.option}) values ($1,$2,$3)`;
    client
        .query(insertIntoAnimeList, safeValuesOfList)
        .then((result) => {
            console.log("insert");
        })
        .catch((error) => {
            console.log(error);
        });
}
app.get("/notification", async (req, res) => {
    let getnotification = `select a.title,a.image_url,a.mal_id from useranime ua
    JOIN users as u on u.user_id = ua.user_id
    JOIN animes as a on a.mal_id = ua.mal_id
    where ua.following = true and  trim(to_char(current_timestamp, 'DAY'))  = a.broadcast
    `;
    // let getnotification = `select trim(to _char(current_timestamp, 'DAY'));
    // `;
    let { rows } = await client.query(getnotification);
    res.send(rows);
});
function signupHandler(req, res) {
    let { userName, password, passwordValidate } = req.body;
    userName = userName.toLocaleLowerCase();
    let safeValues = [userName];
    let sql = "SELECT username FROM users WHERE username=$1;";
    client.query(sql, safeValues).then((results) => {
        if (results.rowCount > 0) {
            console.log(""); //TODO: add alerts
            let message = "Username already exists.";
            res.render("pages/login", { message, localStorage });
        } else {
            if (password != passwordValidate) {
                let message = "Passwords don't match.";
                res.render("pages/login", { message, localStorage });
            } else {
                superAgent.get('http://api.ipstack.com/check?access_key=cb3a596115dc68c37a4f0e6706b05f5b&format=1')
                    .then((results) => {
                        let country = results.body.country_name;
                        let safeValues2 = [userName, password, country];
                        let sql2 =
                            "insert into users (username ,password, country) values ($1 , $2, $3);";
                        client.query(sql2, safeValues2).then(() => {
                            let message = "Sign-Up Successful! Please sign in.";
                            res.render("pages/login", { message, localStorage });
                        });
                    })


            }
        }
    });
}
function signinHandler(req, res) {
    let { userName, password } = req.body;
    userName = userName.toLocaleLowerCase();
    let safeValues = [userName];
    let sql = "SELECT username,user_id FROM users WHERE username=$1;";
    client.query(sql, safeValues).then((results) => {
        if (results.rowCount > 0) {
            console.log("Username exists");
            let safeValues2 = [userName, password];
            let sql2 =
                "SELECT username,user_id,country FROM users WHERE username=$1 AND password=$2;";
            client.query(sql2, safeValues2).then((results2) => {
                if (results2.rowCount > 0) {
                    let user_id = results2.rows[0].user_id;
                    let country = results2.rows[0].country;
                    localStorage.setItem("username", userName);
                    localStorage.setItem("userid", user_id);
                    localStorage.setItem("country", country);
                    console.log("Success");
                    res.redirect("/login");
                } else {
                    let message = "Wrong password.";
                    res.render("pages/login", { message, localStorage });
                }
            });
        } else {
            let message = "Username does not exist.";
            res.render("pages/login", { message, localStorage });
        }
    });
}

const getnotification = async () => {

    let getnotification = `select * from useranime ua
    JOIN users as u on u.user_id = ua.user_id
    JOIN animes as a on a.mal_id = ua.mal_id
    where ua.following = true and  trim(to_char(current_timestamp, 'DAY'))  = a.broadcast
    `;
    return await client.query(getnotification);
};

//// Password changer function
function passwordChanger(req, res) {
    let { currentPassword, newPassword, newPasswordValidate } = req.body;
    let userName = localStorage.getItem("username")
    let safeValues = [userName];
    if (newPassword !== newPasswordValidate) {
        // x
        let message = "New passwords don't match."
        console.log(message);
        res.redirect('/user_list');
    }
    else {
        let sql = "SELECT password FROM users WHERE username=$1;";
        client.query(sql, safeValues).then((results) => {
            let password = results.rows[0].password;
            if (password !== currentPassword) {
                let message = "Current password doesn't match what you input."
                console.log(message);
                res.redirect('/user_list');
            }
            else {
                let safeValues2 = [newPassword, userName];
                let sql2 = 'UPDATE users SET password=$1 WHERE username=$2;'
                client.query(sql2, safeValues2).then(() => {
                    console.log("Password");
                    res.redirect('/user_list');
                }
                )
            }
        })
    }
}


async function searchRender(req, res) {
    let animes = [];
    if (req.query.search !== undefined) {
        let { body } = await superAgent.get(
            `https://api.jikan.moe/v3/search/anime?q=${req.query.search}`
        );
        animes = body.results;
    }
    let { rows: notifications } = await getnotification();
    res.render("pages/search", {
        localStorage, animes, notifications, localUsername: localStorage.getItem("username"),
    });
}


function searchHandler(req, res) {
    let { searchQuery, genre, rated, status } = req.body;
    let url = `https://api.jikan.moe/v3/search/anime?q=${searchQuery}${genre}${rated}${status}&limit=30`;
    superAgent.get(url).then((result) => {
        console.log(result.body);
    });
}

async function mainHandler(req, res) {
    let { rows: notifications } = await getnotification();
    let date = new Date();
    let season = getSeason(date);
    let url = `https://api.jikan.moe/v3/season/${date.getFullYear()}/${season}`;
    let url2 = "https://animechanapi.xyz/api/quotes/random";

    superAgent(url).then((result) => {
        let animeArr = [];
        console.log('first url '+ url)
        for (let i = 0; i < 8; i++) {
            animeArr.push({
                title: result.body.anime[i].title,
                image_url: result.body.anime[i].image_url,
                id: result.body.anime[i].mal_id
            })
        }
        superAgent.get(url2).then((results) => {
            res.render("pages/index", {
                animeArr: animeArr,
                localUsername: localStorage.getItem("username"),
                quote: results.body.data[0],
                localStorage,
                notifications
            });
        })
        .catch(() => {
            res.send("quote");
        });
    })
    .catch(() => {
        res.send("main");
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
            return "fall";
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
    } else {
        res.render("pages/login", { message, localStorage });
    }
}
function logoutHandler(req, res) {
    localStorage.clear();
    res.redirect("/");
}


app.get('*', (req, res) => {
    res.status(404).render('pages/error');
})

client.connect().then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
});
