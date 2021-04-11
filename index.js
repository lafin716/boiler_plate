const express = require('express')
const app = express()
const port = 3000
const config = require('./config/key')

// 모델
const {User} = require('./models/User');

// body parser
const bodyParser = require('body-parser');

// application/x-www-form-urlencoded 헤더 사용
app.use(bodyParser.urlencoded({ extended: true }));

// application/json 헤더 사용
app.use(bodyParser.json());

// DB 설정
const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
    useCreateIndex : true,
    useFindAndModify : false
}).then( () => console.log("mongo db connected"))
.catch( err => console.log(err) )


app.get('/', (req, res) => res.send('Happy new year!'))

// 회원가입 라우트
app.post('/register', (req, res) => { 

    // 회원가입에 필요한 정보를 클라이언트에서 받아오고 DB에 삽입
    const user = new User(req.body)
    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.listen(port, () => console.log('Example app listening on port ${port}'))