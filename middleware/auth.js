const { User } = require("../models/User");

// 인증처리
let auth = (req, res, next) => {

    // 클라이언트 쿠키에서 토큰 가져오기
    let token = req.cookies.x_auth;

    // 토큰을 복호화 후 유저를 찾기
    User.findByToken(token, (err, user) => {
        // 유저가 없으면 에러발생
        if(err) throw err;
        if(!user) return res.json({ isAuth: false, error: true });

        // 유저가 있으면 인증완료
        req.token = token;
        req.user = user;
        next();
    })
}

module.exports = { auth };