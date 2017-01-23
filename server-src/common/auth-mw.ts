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


if (process.env.APP_DEMO_MODE) {
    initSession = combineMiddleware([
        initSession,
        (req, res, next) => {
            ; (req.session || {}).userId = Number(process.env.APP_DEMO_MODE)
            ; (req.session || {}).userName = 'Demo User'
            next()
        }
    ])
}

export var authGate = (req, res, next) => {
    if (process.env.APP_DEMO_MODE) {
        req.session.userId = Number(process.env.APP_DEMO_MODE)
    }
    if (req.session.userId) return next()
    return next(ono({statusCode:400, code:'UNAUTHORIZED'}, 'Não autorizado.'))
}


/**
 * Combine multiple middleware together.
 *
 * @param {Function[]} mids functions of form:
 *   function(req, res, next) { ... }
 * @return {Function} single combined middleware
 */
function combineMiddleware(mids) {
  return mids.reduce(function(a, b) {
    return function(req, res, next) {
      a(req, res, function(err) {
        if (err) {
          return next(err);
        }
        b(req, res, next);
      });
    };
  });
}