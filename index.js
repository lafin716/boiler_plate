const express = require('express')
const app = express()
const port = 3000
const config = require('./config/key')

// 웹 요청 관련 parser
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// 요청 관련 설정
app.use(bodyParser.urlencoded({ extended: true }));     // application/x-www-form-urlencoded 헤더 사용
app.use(bodyParser.json());                             // application/json 헤더 사용
app.use(cookieParser());                                // 쿠키 파서 사용

// 모델가져오기
const {User} = require('./models/User');

// 미들웨어 가져오기
const { auth } = require('./middleware/auth');

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
app.post('/api/users/register', (req, res) => { 

    // 회원가입에 필요한 정보를 클라이언트에서 받아오고 DB에 삽입
    const user = new User(req.body)

    // 몽고에 저장
    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

// 로그인 라우트
app.post('/api/users/login', (req, res) => {

    // 요청된 이메일을 데이터베이스에서 확인
    User.findOne({ email: req.body.email }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "이메일을 찾을 수 없습니다."
            })
        }

        // 요청한 Email이 있으면 비밀번호를 검사한다
        user.comparePassword(req.body.password, (err, isMached) => {
            if(!isMached) return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다." });

            // 비밀번호가 맞다면 토큰을 생성
            user.generateToken( (err, user) => {
                if(err) return res.status(400).send(err)

                // 쿠키에 저장 후 user id 리턴
                res.cookie("x_auth", user.token).status(200).json({ loginSuccess: true, userId: user._id })
            })
        })
    })
    
});

// Auth 라우트
app.get('/api/users/auth', auth, (req, res) => {

    // 미들웨어를 통해서 이곳에 들어오면 인증이 완료되었다는 의미
    // 미들웨어에서 req에 user정보를 넣어줬으므로 req.user.{key} 를 통해 모델 값 접근 가능
    res.status(200).json({ 
        _id: req.user._id,
        name: req.user.name,
        isAdmin: req.user.role === 0 ? false: true,
        isAuth: true,
        email: req.user.email,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    });
})

// 로그아웃 라우트
app.get('/api/users/logout', auth, (req, res) => {

    // 유저 정보를 찾은 후 바로 업데이트
    User.findOneAndUpdate({_id: req.user._id,}, { token: "" }, (err, user) => {
        if(err) return res.json({ success: false, err });

        return res.status(200).send({
            success: true
        })
    })
})

app.listen(port, () => console.log('Example app listening on port ${port}'))