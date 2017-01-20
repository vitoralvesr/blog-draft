import expressSession = require('express-session')
import _mysqlStore = require('express-mysql-session')
const mysqlStore = _mysqlStore(expressSession)
import ono = require('ono')
import db = require('@common/database')

export var session = expressSession({
    secret: 'unusualSecret' ,
    cookie : {
        maxAge : 1000 * 60 * 60 * 24 * 7
    },
    resave : true ,
    saveUninitialized : true ,
    store : new mysqlStore({}, db.legacyConnection)
})


export var authGate = (req, res, next) => {
    console.log('authgate')
    if (req.session.userId) {
        console.log('authorized')
        return next()
    }
    return next(ono({statusCode:400, code:'UNAUTHORIZED'}, 'Não autorizado.'))
}