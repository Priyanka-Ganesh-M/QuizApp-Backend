import express from 'express';
import bodyParser from "body-parser";
import cors from 'cors';
import mongoose from 'mongoose';
import exports from './models.js';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import session from 'express-session';
import 'mongoose-encryption';
import dotenv from 'dotenv'

const app = express();
const port = 4000;

dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const corsOptions = {
    origin: '*',
    credentials : true,
    optionSuccessStatus : 200
}

app.use(cors(corsOptions));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
  }));

  app.use(passport.initialize());
  app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/quizDB", {useNewUrlParser : true}).then(function(){
      console.log("connected")}).catch(function(err){
      console.log(err);
});

const userSchema = new mongoose.Schema({
    username : String,
    password : String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use('user', User.createStrategy());

passport.serializeUser((user, done) => {
    done(null, { type: 'user', id: user._id });
});

passport.deserializeUser(async (sessionData, done) => {
    if (sessionData.type === 'user') {
        try {
            const user = await User.findById(sessionData.id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    } else {
        done(new Error('Invalid session type'), null);
    }
});


app.get('/getQuizzes',(req,res)=>{
    try
    {
        exports.models.Quiz.find({}).then(function(allQuiz){
        if(allQuiz)
        res.json(allQuiz);
    
        else
        res.json({'message' : 'no quiz'});
    });
   }
   catch(e)
   {res.json({'message' : 'error'})}
})

app.get('/getQuiz/:quizId', (req,res)=>{
    const quizId = req.params.quizId;
    console.log(quizId)
    exports.models.QuizQues.find({ quizId: quizId}).then((allQues, err) => {
        if (allQues && allQues.length > 0) {
            res.json(allQues);
            console.log(allQues)
        } else {
            res.json({ message: 'No questions found for the specified quizId' });
        }
    });
});


app.get('/getQuestions/:quesId',(req,res)=>{
    const quesId = req.params.quesId;
        exports.models.QuizQues.findOne({_id : quesId}).then(function(q){
        if(q)
        res.json(q);
    
        else
        res.json({'message' : 'no question'});
    })
})

app.get('/getQuizzes/:quesId', (req,res)=>{
    const quesId = req.params.quesId;
    console.log(quesId)
    exports.models.QuesOpt.find({quesId : quesId}).then(function(options){
        if(options)
        {
        console.log(options)
        res.json(options);
        }

        else
        res.json({'message' : 'no options'});
    })
})

app.post('/postQuiz',(req,res)=>{
    const quizTitle = req.body.title;
    const questions = req.body.questions;
    const newQuiz = new exports.models.Quiz({
        title : quizTitle
    });

    newQuiz.save()
    .then(async newQ => {
        const quizId = newQ._id;

        try {
            questions.forEach((question)=>{
                const newQues = new exports.models.QuizQues({
                    quizId : quizId,
                    question : question.text
                });
                newQues.save().then(async newQu=> {
                    const quesId = newQu._id;
                    question.options.forEach((opt)=>{
                        const newOpt = new exports.models.QuesOpt({
                            quesId : quesId,
                            option : opt.text,
                        })
                        newOpt.save();
                    });
                    exports.models.QuesOpt.findOne({option : question.correctOption.text}).then((op)=>{
                       
                    const newAns = new exports.models.QuesAns({
                        quesId : quesId,
                        optId : op._id,
                        })
                        newAns.save();
                    })
                    })
                });
            
        } catch (error) {
            console.error('Error updating employer:', error);
        }
    })
    .catch(error => {
        console.error('Error saving the new post:', error);
    });
})


  

  app.post('/result', async (req, res) => {
    try {
      const userAnswers = req.body.userAnswers;
  
      // Fetch the correct option from the database
      let result = 0;
  
      // Use Promise.all to wait for all asynchronous operations
      await Promise.all(userAnswers.map(async (userAnswer) => {
        const quesAns = await exports.models.QuesAns.findOne({ quesId: userAnswer.questionId });
  
        if (quesAns && String(quesAns.optId) === String(userAnswer.selectedOption)) {
          result = result + 1;
        }
      }));
  
      console.log(result);
      res.json({ result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post("/register",(req,res)=>{
    User.register({username : req.body.username}, req.body.password,async function (err,user){
        if(err)
        {
            console.log(err);
        }
        else
        {
            console.log(user)
            await passport.authenticate('user')(req,res,function(){
                console.log("logging in");
                if(req.user) {
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    const user = req.user;
        
        
                    return res.status(200).json({user: {
                        id: user._id,
                        email: user.email,
                    }});
                }
                
            })
        }
    })
    
});


app.post("/log-in",(req,res)=>{
    console.log(req.body)
    const user = new User({
        username : req.body.username,
        password : req.body.password,
    });

    req.login(user, function(err){
        if(err)
        {
           console.log(err);
        }
        else
        {
            console.log(user);
            passport.authenticate('user')(req,res, function(){
            console.log('logging in');
            if(req.user) {
                res.setHeader('Access-Control-Allow-Credentials', 'true')
                const user = req.user;
    
    
                return res.status(200).json({user: {
                    id: user._id,
                    email: user.email,
                }});
            }
            });
           
        }
    })
        
    });

app.get('/quiz/:title',(req,res)=>{
    const title = req.params.title;
    console.log(title)
    exports.models.Quiz.findOne({title : title}).then((quiz)=>{
        if(quiz != null)
        res.json({id : quiz._id});

        else
        res.json(null)
    })
})
app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
  });