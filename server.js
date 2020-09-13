'use strict';
require('dotenv').config();

const express = require('express');
const PORT = process.env.PORT || 3000;
const superAgent = require('superagent');
const app = express();
const pg = require('pg')
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverRide = require('method-override');
let localStorage =null;
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
  }
app.use(methodOverRide('_method'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.get('/',mainHandler);
app.get('/login',loginHandler)
app.post('/signup',signupHandler);
app.post('/signin',signinHandler);
app.get('/logout',logoutHandler);

function signupHandler(req,res){
    let {userName, password } = req.body;
    let safeValues =[userName];
    let sql = 'SELECT username FROM users WHERE username=$1;'
    client.query(sql,safeValues).then((results)=>{
        console.log(results.rows);
        if(results.rowCount > 0 ){
            console.log('username already exists');//TODO: add alerts
            res.redirect('/login');
        } else{
            let safeValues2 =[userName,password];
            let sql2='insert into users (username ,password) values ($1 , $2);'
            client.query(sql2,safeValues2).then(()=>{
                console.log('user added');
                res.redirect('/login');

            })
        }

    })

}
function signinHandler(req, res){
    let {userName, password } = req.body;
    let safeValues =[userName,password];
    let sql = 'SELECT username FROM users WHERE username=$1 AND password=$2;'
    client.query(sql,safeValues).then((results)=>{
        console.log(results.rows);
        if(results.rowCount > 0 ){
            console.log('login successful');
            localStorage.setItem('username',userName);
            // localStorage.setItem('myFirstKey', 'myFirstValue');
            console.log(localStorage.getItem('username'));

            res.redirect('/login');
        } else{
            console.log('login unsuccessful');
            res.redirect('/login');
        }

    })

}
function mainHandler(req,res){
    res.render('pages/index');
}
function loginHandler(req,res){
    if(localStorage.getItem('username') != null){
        res.redirect('/');
        console.log('logged in');
    }else {
        res.render('pages/login');
        console.log('nope');    
    }

}
function logoutHandler(req,res){
    localStorage.clear();
    res.redirect('/');

}


client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  })