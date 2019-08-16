const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express')
const path = require('path')
const bcrypt = require('bcrypt')
const session = require('express-session')
const upload = require('express-fileupload')
app.use(upload())
app.use(express.urlencoded())

const VIEWS_PATH = path.join(__dirname,'/views')
app.engine('mustache',mustacheExpress(VIEWS_PATH + '/partials','.mustache'))
app.set('views',VIEWS_PATH)
app.set('view engine','.mustache')

//const userRoutes = require('./routes/users')
app.use('/css',express.static("css"))

app.use(session({
    secret:'lumjcon',
    resave: false,
    saveUninitialized: false
}))
//app.use('/users',userRoutes)

var pgp = require('pg-promise')();
var connectionString = 'postgres://localhost:5430/choir';
 db = pgp(connectionString);
const SALT_ROUNDS =10

//logout page
app.get('/logout',(req,res,next) =>{
    if(req.session){
        req.session.destroy((error) =>{
            if(error){
                next(error)
            }else{
                res.redirect('/login')
            }
        })
    }
})

//upload page

app.get('/upload',(req,res)=>{
    res.render('upload')
})
app.post('/upload',(req,res) =>{
    res.redirect('/')
})
//update page
app.get('/update/:songid',(req,res) =>{
    let songid = parseInt(req.params.songid)
    db.any('SELECT songid, artist,title,lyrics FROM songs WHERE songid=$1',[songid])
    .then((songs) =>{
        res.render('update',{songs:songs})

    })

})
app.post('/edit',(req,res) =>{
    let songid = req.body.songid
    console.log(songid)
    res.redirect(`/update/${songid}`)
})
app.post('/update',(req,res) =>{
    let artist = req.body.artist
    let title = req.body.title
    let lyrics = req.body.lyrics
    let categories = req.body.categories
    let songid = parseInt(req.body.songid)

    db.one('UPDATE songs SET artist=$2, title=$3, lyrics=$4 ,categories=$5 WHERE songid =$1 RETURNING *',[songid,artist,title,lyrics,categories])
    .then(() =>{
        console.log("UPDATED")
        res.redirect('/')
    }).catch(error =>{
        console.log(error)
    })
})

//update worship page
app.get('/updateWorship/:songid',(req,res) =>{
    let songid = parseInt(req.params.songid)
    db.any('SELECT songid, artist,title,lyrics FROM songs WHERE songid=$1',[songid])
    .then((songs) =>{
        res.render('updateWorship',{songs:songs})

    })

})
app.post('/edit',(req,res) =>{
    let songid = req.body.songid
    console.log(songid)
    res.redirect(`/updateWorship/${songid}`)
})
app.post('/updateWorship',(req,res) =>{
    let artist = req.body.artist
    let title = req.body.title
    let lyrics = req.body.lyrics
    let categories = req.body.categories
    let songid = parseInt(req.body.songid)

    db.one('UPDATE songs SET artist=$2, title=$3, lyrics=$4 ,categories=$5 WHERE songid =$1 RETURNING *',[songid,artist,title,lyrics,categories])
    .then(() =>{
        console.log("UPDATED")
        res.redirect('/worship')
    }).catch(error =>{
        console.log(error)
    })
})


//main delete page

app.post('/delete',(req,res)=>{
    let songid = req.body.songid
    db.none('DELETE FROM songs WHERE songid=$1',[songid])
    .then(() =>{
        res.redirect('/')
    })
})
//delete praise page
app.post('/deletePraise',(req,res)=>{
    let songid = req.body.songid
    db.none('DELETE FROM songs WHERE songid=$1',[songid])
    .then(() =>{
        res.redirect('/praise')
    })
})
//delete worship page
app.post('/deleteWorship',(req,res)=>{
    let songid = req.body.songid
    db.none('DELETE FROM songs WHERE songid=$1',[songid])
    .then(() =>{
        res.redirect('/worship')
    })
})

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

                }else{
                    res.render('login',{message:"invalid username or password"})
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
    db.any('SELECT songid,artist,title,lyrics ,categories FROM songs;')
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
    let categories = req.body.categories

    db.one('INSERT INTO songs(artist,title,lyrics,categories) VALUES($1,$2,$3,$4) RETURNING songid',
    [artist,title,lyrics,categories])
    .then((data) =>{
        res.redirect('/') 
        console.log(data)
    }).catch(error =>{console.log(error)

     
})
})

app.get('/praise', (req, res) => {
    let categories = "praise"
    console.log(categories)

    db.any('SELECT songid,artist,title,lyrics ,categories FROM songs WHERE categories=$1;', [categories])
    .then(songs=>{
        console.log(songs)
        res.render('praise',{songs:songs})
    })

})

app.get('/worship', (req, res) => {
    let categories ="worship"
    console.log(categories)

    db.any('SELECT songid,artist,title,lyrics ,categories FROM songs WHERE categories=$1;', [categories])
    .then(songs =>{
        res.render('worship',{songs:songs})
    })
    
})


app.get('/quickview',(req,res) =>{
    let artist = req.body.artist
    let title = req.body.title
  
    db.any('SELECT songid,artist,title FROM songs')
})
app.listen(3000,()=>{
    console.log('server is on')
})
