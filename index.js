const express = require("express");
const mysql = require('mysql');
const app = express();
const pool = dbConnection();
const bcrypt = require('bcrypt');
const session = require('express-session')
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(express.static("public"));
// to parse Form data sent using POST method
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'random ch@r@ct3rs',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

// root route
app.get('/', (req, res) => {
  res.render('login');
});

// new route added today
app.get('/searchuser', isAuthenticated , async (req, res) => {
  let sql = `SELECT actorId, name
             FROM actors
             ORDER BY name ASC`
  let rows = await executeSQL(sql);

  let sql2 = `SELECT DISTINCT rated
              FROM movies`
              
  let rows2 = await executeSQL(sql2);
  
  res.render('searchuser', {"names": rows, "rate": rows2})
});

///
app.get('/create', (req, res) => {
  res.render('create')
});
////


app.post('/addUser', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  let sql = `INSERT INTO admins
             (username, password)
             VALUES (?, ?)`

  const hash = bcrypt.hashSync(password, saltRounds);
  let params = [username, hash];
  let rows = await executeSQL(sql, params);
  
  res.render('login')
});
///

app.get('/home', isAuthenticated, (req, res) => {
  res.render('home')
});

app.get('/userPage', isAuthenticated, (req, res) => {
  res.render('userPage')
});

app.post('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let passwordHash = "";

  let sql = `SELECT password , username
             FROM admins
             WHERE username = ?`
  let rows = await executeSQL(sql, [username]);
    
  if (rows.length > 0) { // when username found in database
    passwordHash = rows[0].password;
  }

  const match = await bcrypt.compare(password, passwordHash);

  if (match) {
    if(rows[0].username != "admin"){
      req.session.authenticated = true;
      res.render('userPage')
    }else{
    req.session.authenticated = true;
    res.redirect('home')
    }
  } else {
    res.render('login', { "error": "Wrong Credentials!" })
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/search', isAuthenticated, async (req, res) => {
  let sql = `SELECT actorId, name
             FROM actors
             ORDER BY name ASC`
  let rows = await executeSQL(sql);

  let sql2 = `SELECT DISTINCT rated
              FROM movies`
              
  let rows2 = await executeSQL(sql2);
  
  res.render('search', {"names": rows, "rate": rows2})
});



app.get('/searchByTitle', isAuthenticated, async (req, res) => {
  let keyword = req.query.title;
  keyword += "%"
  let sql = `SELECT name, title, rated, poster, actors.actorId, movieId
             FROM movies
             INNER JOIN actors
             ON movies.actorId = actors.actorId
             WHERE title LIKE ?`

  let rows = await executeSQL(sql, [keyword]);
  res.render("results", {"movies": rows});
  //res.send(rows);
});

// new route
app.get('/searchByTitl', isAuthenticated, async (req, res) => {
  let keyword = req.query.title;
  keyword += "%";
  let sql = `SELECT name, title, rated, poster, actors.actorId, movieId
             FROM movies
             INNER JOIN actors
             ON movies.actorId = actors.actorId
             WHERE title LIKE ?`

  let rows = await executeSQL(sql, [keyword]);
  res.render("resultsuser", {"movies": rows});
});

app.get('/searchByActor', isAuthenticated, async (req, res) => {
  let keyword = req.query.actorId;
  let sql = `SELECT name, title, rated, poster, actors.actorId, movieId
             FROM movies
             INNER JOIN actors
             ON movies.actorId = actors.actorId 
             WHERE actors.actorId = ?`

  let rows = await executeSQL(sql, [keyword]);
  res.render("results", {"movies":rows});
});

//new route created today
app.get('/searchByActo', isAuthenticated, async (req, res) => {
  let keyword = req.query.actorId;
  let sql = `SELECT name, title, rated, poster, actors.actorId, movieId
             FROM movies
             INNER JOIN actors
             ON movies.actorId = actors.actorId 
             WHERE actors.actorId = ?`

  let rows = await executeSQL(sql, [keyword]);
  res.render("resultsuser", {"movies":rows});
});
////

app.get('/searchByRating', isAuthenticated, async (req, res) => {
  let keyword = req.query.rating;
  let sql = `SELECT *
             FROM movies
             INNER JOIN actors
             ON movies.actorId = actors.actorId 
             WHERE rated = ?`

  let rows = await executeSQL(sql, [keyword]);
  res.render("results", {"movies": rows});
});

//new route created today
app.get('/searchByRatin', isAuthenticated, async (req, res) => {
  let keyword = req.query.rating;
  let sql = `SELECT *
             FROM movies
             INNER JOIN actors
             ON movies.actorId = actors.actorId 
             WHERE rated = ?`

  let rows = await executeSQL(sql, [keyword]);
  res.render("resultsuser", {"movies": rows});
});



app.get('/api/actors/:actorId', isAuthenticated, async (req, res) => {
  let id = req.params.actorId;
  let sql = `SELECT * 
             FROM actors
             WHERE actorId = ?`
  
  let rows = await executeSQL(sql, [id]);
  res.send(rows);
});

app.get('/api/movies/:movieId', isAuthenticated, async (req, res) => {
  let id = req.params.movieId;
  let sql = `SELECT *
             FROM movies
             WHERE movieId = ?`
  
  let rows = await executeSQL(sql, [id]);
  res.send(rows);
});

app.get('/addMovie', isAuthenticated, async (req, res) => {
  let sql = `SELECT DISTINCT actorId, name
             FROM actors`;

  let rows = await executeSQL(sql);
  res.render('addMovie', {'actor': rows});
});

app.post('/addMovie', isAuthenticated, async (req, res) => {
  let actorId = req.body.actor;
  let title = req.body.title;
  let genre = req.body.genre;
  let year = req.body.year;
  let description = req.body.description;
  let rated = req.body.rated;
  let poster = req.body.poster;
    
  let sql = `INSERT INTO movies
             (actorId, title, genre, year, description, rated, poster)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;

  let params = [actorId, title, genre, year, description, rated, poster]
  let rows = await executeSQL(sql, params);
  
  res.redirect('/home');
});

app.get('/movies', isAuthenticated, async (req, res) => {
  let sql = `SELECT movieId, title, rated, poster, genre
             FROM movies
             ORDER BY title`;

  let rows = await executeSQL(sql);
  res.render('movies', {"movies": rows});
});

app.get('/usermovies', isAuthenticated, async (req, res) => {
  let sql = `SELECT movieId, title, rated, poster, genre
             FROM movies
             ORDER BY title`;

  let rows = await executeSQL(sql);
  res.render('usermovies', {"movies": rows});
});

app.get('/useractors', isAuthenticated, async (req, res) => {
  let sql = `SELECT actorId, name, portrait
             FROM actors
             ORDER BY name`;

  let rows = await executeSQL(sql);
  res.render('useractors', {"actors": rows});
});

app.get('/updateMovie', isAuthenticated, async (req, res) => {
  let movieId = req.query.id;
  let sql = `SELECT *
             FROM movies
             WHERE movieId = ?`;
  let rows = await executeSQL(sql, [movieId]);
  res.render('updateMovie', {"movieInfo": rows});
});

app.post('/updateMovie', isAuthenticated, async (req, res) => {
  let name = req.body.title;
  let genre = req.body.genre;
  let year = req.body.year;
  let desc = req.body.desc;
  let rating = req.body.rating;
  let poster = req.body.poster;
  let movieId = req.body.movieId;
  
  let sql = `UPDATE movies
             SET title = ?,
                 genre = ?,
                 year = ?,
                 description = ?,
                 rated = ?,
                 poster = ?
             WHERE movieId = ?`;

  let params = [name, genre, year, desc, rating, poster, movieId];
  let rows = await executeSQL(sql, params);
  res.redirect('/updateMovie?id='+movieId)
});

app.get('/deleteMovie', isAuthenticated, async (req, res) => {
  let movieId = req.query.id
  let sql = `DELETE FROM movies
             WHERE movieId = ?`
  
  let rows = await executeSQL(sql, [movieId])
  res.redirect('movies')
});

app.get('/addActor', isAuthenticated, (req, res) => {
  res.render('addActor');
});

app.post('/addActor', isAuthenticated, async (req, res) => {
  let name = req.body.name;
  let age = req.body.age;
  let about = req.body.about;
  let picture = req.body.picture;
    
  let sql = `INSERT INTO actors
             (name, age, portrait, about)
             VALUES (?, ?, ?, ?)`;

  let params = [name, age, picture, about]
  let rows = await executeSQL(sql, params);
  
  res.redirect('home');
});

app.get('/actors', isAuthenticated, async (req, res) => {
  let sql = `SELECT actorId, name, portrait
             FROM actors
             ORDER BY name`;

  let rows = await executeSQL(sql);
  res.render('actors', {"actors":rows});
});

app.get('/updateActor', isAuthenticated, async (req, res) => {
  let actorId = req.query.id;
  let sql = `SELECT *
             FROM actors
             WHERE actorId = ?`;
  let rows = await executeSQL(sql, [actorId]);
  res.render('updateActor', {"actorInfo": rows});
});

app.post('/updateActor', isAuthenticated, async (req, res) => {
  let name = req.body.actorName;
  let age = req.body.Age;
  let picture = req.body.picture;
  let about = req.body.about;
  let actorId = req.body.actorId;
  
  let sql = `UPDATE actors
             SET name = ?,
                 age = ?,
                 portrait = ?,
                 about = ?
             WHERE actorId = ?`;

  let params = [name, age, picture, about, actorId];
  let rows = await executeSQL(sql, params);
  res.redirect('/updateActor?id='+actorId)
});

app.get('/deleteActor', isAuthenticated, async (req, res) => {
  let actorId = req.query.id
  let sql = `DELETE FROM actors
             WHERE actorId = ?`
  
  let rows = await executeSQL(sql, [actorId])
  res.redirect('actors')
});

app.get("/dbTest", async function(req, res) {
  let sql = "SELECT CURDATE()";
  let rows = await executeSQL(sql);
  res.send(rows);
}); // dbTest

// functions
function isAuthenticated(req, res, next){
if(req.session.authenticated){
   next();
  }
  else {
    res.redirect('/')
  }
}

async function executeSQL(sql, params) {
  return new Promise(function(resolve, reject) {
    pool.query(sql, params, function(err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
} // executeSQL
// values in red must be updated
function dbConnection() {

  const pool = mysql.createPool({

    connectionLimit: 10,
    host: "migae5o25m2psr4q.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "udqqx4r5ywaitmh9",
    password: "ij2vybdvjh0med11",
    database: "oxwpj1szn9l6b8kh"
  });

  return pool;

} // dbConnection

// start server
app.listen(3000, () => {
  console.log("Express server running...")
})