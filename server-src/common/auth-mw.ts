import expressSession = require('express-session')
import _mysqlStore = require('express-mysql-session')
const mysqlStore = _mysqlStore(expressSession)
import ono = require('ono')
import db = require('@common/database')



export var initSession = expressSession({
    secret: 'unusualSecret' ,
    cookie : {
        maxAge : 1000 * 60 * 60 * 24 * 7
    },
    resave : true ,
    saveUninitialized : true ,
    store : new mysqlStore({}, db.legacyConnection)
})


export var authGate = (req, res, next) => {
    if (process.env.APP_DEMO_MODE) {
        req.session.userId = Number(process.env.APP_DEMO_MODE)
        return next()
    }
    if (req.session.userId) return next()
    return next(ono({statusCode:400, code:'UNAUTHORIZED'}, 'Não autorizado.'))
}