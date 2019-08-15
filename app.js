const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express')
const path = require('path')
const bcrypt = require('bcrypt')


app.use(express.urlencoded())

const VIEWS_PATH = path.join(__dirname,'/views')
app.engine('mustache',mustacheExpress(VIEWS_PATH + '/partials','.mustache'))
app.set('views',VIEWS_PATH)
app.set('view engine','.mustache')


var pgp = require('pg-promise')();
var connectionString = 'postgres://localhost:5430/choir';
var db = pgp(connectionString);
const SALT_ROUNDS =10



//login page
app.get('/login',(req,res) =>{
    res.render('login')
})
app.post('/login',(req,res)=>{
    let username = req.body.username
    let password = req.body.password


    db.oneOrNone('SELECT userid,username,password FROM users WHERE username = $1',[username])
    .then((user) =>{
        if(user){
            bcrypt.compare(password,user.password,function(error,result){
                if(result){
                    res.redirect('/')
                }else{
                    res.render('login',{message:"invalid username or password"})
                }
            })
        }
    })
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.post('/register',(req,res)=>{
    let username = req.body.username
    let password =req.body.password

    db.oneOrNone('SELECT userid FROM users WHERE username =$1',[username])
    .then((user) =>{
        if(user) {
            res.render('register',{message:"user exist"})
        }else{

            bcrypt.hash(password,SALT_ROUNDS,function(error,hash){

                if (error == null){
                    db.none('INSERT INTO users(username,password) VALUES($1,$2)',[username,hash])
             .then(() =>{
               
                 res.redirect('/login')
             })
          
                }
            })
        
    }
    })
})
//login page

//main index page
app.get('/',(req,res) =>{
    db.any('SELECT songid,artist,title,lyrics FROM songs;')
    .then(songs=>{

        res.render('index',{songs:songs})
    })

app.post('/',(req,res) =>{
    res.render('index')
})
})
// add song page
app.get('/add-song',(req,res) =>{
    res.render('add-song')
})
app.post('/add-song',(req,res)=>{
    let artist = req.body.artist
    let title = req.body.title
    let lyrics = req.body.lyrics

    db.one('INSERT INTO songs(artist,title,lyrics) VALUES($1,$2,$3) RETURNING songid',
    [artist,title,lyrics])
    .then((data) =>{
        console.log(data)
    }).catch(error =>{console.log(error)

     res.redirect('index')  
})
})

app.listen(3000,()=>{
    console.log('server is on')
})
