const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
});

// 저장하기 전처리
userSchema.pre('save', function(next){

    // 현재 모델 객체
    var user = this

    // 비밀번호가 변경 되었을 때만 암호화 처리
    if(user.isModified('password')){
        // 비밀번호 암호화 하기
        bcrypt.genSalt(saltRounds, function(err, salt){
            if(err) return next(err)

            bcrypt.hash(user.password, salt, function(err, hash){
                if(err) return next(err)

                // 암호화 성공 시 해시값으로 치환
                user.password = hash

                // 저장 처리로 넘어감
                next()
            })
        })
    }else{
        // next를 해주지 않으면 전처리에서 넘어가지 않으므로 next() 를 호출해 준다.
        next()
    }
    
})

// 비밀번호 비교 함수 추가
userSchema.methods.comparePassword = function (plainPassword, _callback){

    // 현재객체 가져옴
    var user = this;

    // plainPassword를 암호화 
    bcrypt.compare(plainPassword, user.password, function(err, isMatch){
        if(err) return _callback(err);
        
        _callback(null, isMatch);
    })
}

// 토큰 생성 함수
userSchema.methods.generateToken = function(_callback){

    // 현재 객체 가져옴
    var user = this;

    // jsonwebtoken 라이브러리로 토큰 생성
    var token = jwt.sign(user._id.toHexString(), 'secretToken')
    user.token = token

    // 유저 정보 저장
    user.save((err, user) => {
        if(err) return _callback(err);
        
        _callback(null, user);
    })
}

// 토큰으로 유저 정보 가져오는 함수
userSchema.statics.findByToken = function(token, _callback){
    var user = this;

    // 토큰을 복호화 한다
    jwt.verify(token, 'secretToken', function(err, decoded) {
        // 유저아이디 이용해서 유저를 찾고 클라이언트 토큰과 DB토큰 일치 여부 확인
        user.findOne({"_id": decoded, "token": token}, function(err, user){
            if(err) return _callback(err);
            _callback(null, user);
        });
    });
}

const User = mongoose.model('User', userSchema);

module.exports = { User };