const session = require('express-session')
const mysqlStore = require('express-mysql-session')(session)
const ono = require('ono')


exports.session = session({
    secret: 'unusualSecret' ,
    cookie : {
        maxAge : 1000 * 60 * 60 * 24 * 7
    },
    resave : true ,
    saveUninitialized : true ,
    store : new mysqlStore({}, $legacyConnection)
})


exports.authGate = (req, res, next) => {
    console.log('authgate')
    if (req.session.userId) {
        console.log('authorized')
        return next()
    }
    return next(ono({statusCode:400, code:'UNAUTHORIZED'}, 'Não autorizado.'))
}