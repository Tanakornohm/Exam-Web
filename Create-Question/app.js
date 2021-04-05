const express = require('express');
const app = express();
const twig = require('twig');
const bodyParser = require('body-parser');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const cors = require('cors');


// IMPORT DB CONNECTION
const connection = require('./config/database');

// SET VIEW ENGINE
// app.set('view engine','html');
// app.engine('html', twig.__express);
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');
// app.set('views','views');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cors())
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));


// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE

// USE BODY-PARSER MIDDLEWARE
app.use(bodyParser.urlencoded({extended:false}));



// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
    connection.query("SELECT `name` FROM `users` WHERE `user_id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('home',{
            name:rows[0].name
        });
    });
    
});// END OF ROOT PAGE

// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return connection.query('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            connection.query("INSERT INTO `users`(`name`,`email`,`password`) VALUES(?,?,?)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE

// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return connection.query('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        connection.query("SELECT * FROM `users` WHERE `email`=?",[user_email])
        .then(([rows]) => {
            bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].user_id;

                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

app.get('/questions', (req, res) => {
    // FETCH ALL THE questions FROM DATABASE
    connection.query("SELECT * FROM `subjectiveQuestions`",)
    .then(([subj]) => {
        connection.query("SELECT * FROM `tfQuestions`",)
    .then(([truefalse]) => {
        connection.query("SELECT * FROM `multipleChoiceQuestions`",)
    .then(([choice]) => {
        console.log(subj)
        console.log(truefalse)
        console.log(choice)
        res.render('index',{
            posts:subj,
            posts2:truefalse,
            posts3:choice,
        });
    });
    });
    });
    // connection.query('SELECT * FROM `courses`', (err, results) => {
    //     if (err) throw err;
    //     // RENDERING INDEX.HTML FILE WITH ALL POSTS
    //     res.render('index',{
    //         posts:results
    //     });
    // });
    
});
app.get('/course2', (req, res) => {
    res.render('createExam');
    
});

app.get('/course', (req, res) => {
    // FETCH ALL THE questions FROM DATABASE
    connection.query("SELECT * FROM `teach`",)
    .then(([data]) => {
        connection.query("SELECT * FROM `courses`",)
        .then(([rows]) => {
            res.render('course',{
                courses:rows,
                teach:data
            });
        });
    });
    
});
app.post('/create-course', (req, res) => {
    const title = req.body.title;
    const semester = req.body.semester;
    let c_id = 0;
    const post = {
        title: title,
    }
    connection.query('INSERT INTO `courses` SET ?', post, (err) => {
        if (err) throw err;
        console.log('Data inserted');
    }),
    connection.query("SELECT `course_id` FROM `courses` WHERE `title` =?",[title])
    .then(([data]) => {
        c_id = data[0].course_id
        const post2 = {
            course_id: c_id,
            owner_id: req.session.userID,
            semester: semester
        }
        connection.query('INSERT INTO `teach` SET ?', post2, (err) => {
            if (err) throw err;
            console.log('Data inserted');
            return res.redirect('/course');
        });
    });
    
});

// INSERTING POST
app.post('/create-subjective', (req, res) => {
    const title = req.body.title;
    const post = {
        title: title,
        modifiedDatetime: new Date(),
        owner_id:req.session.userID
    }
    connection.query('INSERT INTO `subjectiveQuestions` SET ?', post, (err) => {
        if (err) throw err;
        console.log('Data inserted');
        return res.redirect('/');
    });
});
app.post('/create-choice', (req, res) => {
    const title = req.body.title2;
    const choice1 = req.body.c1;
    const choice2 = req.body.c2;
    const choice3 = req.body.c3;
    const choice4 = req.body.c4;
    const v1 = req.body.v1;
    const post = {
        title: title,
        choice1: choice1,
        choice2: choice2,
        choice3: choice3,
        choice4: choice4,
        answer: v1,
        modifiedDatetime: new Date(),
        owner_id:req.session.userID
    }
    connection.query('INSERT INTO `multipleChoiceQuestions` SET ?', post, (err) => {
        if (err) throw err;
        console.log('Data inserted');
        return res.redirect('/');
    });
});
app.post('/create-truefalse', (req, res) => {
    const title = req.body.title3;
    const v1 = req.body.v1;
    let answer = '';
    console.log(v1);
    if (v1 == 1){
        answer = 'True'
    }else{
        answer = 'False'
    }
    
    const post = {
        title: title,
        status: answer,
        modifiedDatetime: new Date(),
        owner_id:req.session.userID
        
    }
    connection.query('INSERT INTO `tfQuestions` SET ?', post, (err) => {
        if (err) throw err;
        console.log('Data inserted');
        return res.redirect('/getCourses');
    });
});
app.post('/create-exampaper', (req, res) => {
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const semester = req.body.semester;
    console.log(startDate);
    console.log(endDate);
    console.log(semester);
    
    
    // const post = {
    //     title: title,
    //     status: answer,
    //     modifiedDatetime: new Date(),
    //     owner_id:req.session.userID
        
    // }
    // connection.query('INSERT INTO `tfQuestions` SET ?', post, (err) => {
    //     if (err) throw err;
    //     console.log('Data inserted');
    //     return res.redirect('/getCourses');
    // });
});
app.post('/generate-score', (req, res) => {
    const title = req.body.title;
    const post = {
        q_id: title,
        score: 0,
    }
    connection.query('INSERT INTO `exam` SET ?', post, (err) => {
        if (err) throw err;
        console.log('Data inserted');
        return res.redirect('/');
    });
});

// EDIT PAGE
app.get('/edit/:id', (req, res) => {
    const edit_postId = req.params.id;
    // FIND POST BY ID
    connection.query('SELECT * FROM `questions` WHERE id=?',[edit_postId] , (err, results) => {
        if (err) throw err;
        res.render('edit',{
            post:results[0]
        });
    });
});

// POST UPDATING
app.post('/edit/:id', (req, res) => {
    const update_title = req.body.title;
    const update_choice1 = req.body.choice1
    const update_choice2 = req.body.choice2
    const update_choice3 = req.body.choice3
    const update_choice4 = req.body.choice4
    const update_answer = req.body.answer
    const userId = req.params.id;
    if (update_choice1 != null){
    connection.query('UPDATE `questions` SET choice1 = ? WHERE id = ?', [update_choice1, userId]),
    connection.query('UPDATE `questions` SET choice2 = ? WHERE id = ?', [update_choice2, userId]),
    connection.query('UPDATE `questions` SET choice3 = ? WHERE id = ?', [update_choice3, userId]),
    connection.query('UPDATE `questions` SET choice4 = ? WHERE id = ?', [update_choice4, userId])
    
    }
    connection.query('UPDATE `questions` SET title = ? WHERE id = ?', [update_title, userId], (err, results) => {
        if (err) throw err;
        if(results.changedRows === 1){
            console.log('Post Updated');
            return res.redirect('/');
        }
    });
    connection.query('UPDATE `questions` SET answer = ? WHERE id = ?', [update_answer, userId])
    
});

// POST DELETING
app.get('/delete/:id', (req, res) => {
    connection.query('DELETE FROM `questions` WHERE id = ?', [req.params.id], (err, results) => {
        if (err) throw err;
        res.redirect('/');
    });
});
// SET 404 PAGE
app.use('/',(req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});
// IF DATABASE CONNECTION IS SUCCESSFUL
connection.connect((err) => {
    if (err) throw err;
});

app.listen(4000, () => console.log("Server is Running..."));