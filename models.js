import mongoose from 'mongoose';


const quizSchema = new mongoose.Schema({
    title : String
});

const Quiz = new mongoose.model("Quiz", quizSchema);

const quizQuesSchema = new mongoose.Schema({
    question : String,
    quizId : [{ type:String, ref: 'Quiz' }]
});

const QuizQues = new mongoose.model("QuizQues", quizQuesSchema);

const quesOptSchema = new mongoose.Schema({
    quesId : [{ type:String, ref: 'QuizQues' }],
    option : String,
});

const QuesOpt = new mongoose.model("QuesOpt", quesOptSchema);

const quesAnsSchema = new mongoose.Schema({
    quesId : { type: String, ref: 'QuizQues' },
    optId : { type:  String, ref: 'QuesOpt' },
});

const QuesAns = new mongoose.model("QuesAns", quesAnsSchema);

const exports = {
    models : {
        'Quiz' : Quiz, 'QuizQues' : QuizQues, 'QuesOpt': QuesOpt, 'QuesAns' : QuesAns
    },
    schemas : {
         'quizSchema' : quizSchema, 'quizQuesSchema' :quizQuesSchema, 'quesAnsSchema' : quesAnsSchema, 'quesOptSchema' : quesOptSchema
    }
}

export default exports;