// ---- module shim for custom paths

var Module = require('module');
var originalRequire = Module.prototype.require;

Module.prototype.require = function(...args){
    let path = args[0]
    if (path.charAt(0) === '@') path = process.cwd() + '/' + path.substr(1)
    args[0] = path
    return originalRequire.apply(this, args);
};

// ---- end module shim

import express = require('express')
const app = express()
import ono = require('ono')
import database = require('./common/database')
import roles = require('./common/roles')
import config = require('./common/config')
import '@common/mail' //init

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

global['$debugMw'] = (msg) => (req, res, next) => {
    console.log('DEBUGMW layer route', this.route, msg||'')
    next()
}


//replace with a logger in the future
global['$log'] = console.log


/**
 * Shorthand for checking parameters, adds underline for convention
 */
global['$checkParams'] = function(obj, ...params) {
    let out = {}
    out = params.reduce( (previous, param) => {
        if (obj[param] === undefined) {
            throw ono(
                {code:'MISSING_PARAM', param},
                `Parâmetro -${param}- está faltando.`
            )
        }
        previous['_' + param] = obj[param]
        return previous
    }, {})

    return out
}


//tomelhe global. TODO arrumar essa zona
global['$promisify'] = function( fn, ...args ) {
    return new Promise( (resolve, reject) => {
        fn( ...args , (err, ...result) => {
            if (err) return reject(err)
            resolve(result)
        })
    })
}


database.init().then(() => {
    return Promise.all([
        roles.init(),
        config.init(),
    ])
}).then(() => {

    app.use('/assets',
        express.static('../public', process.env.NODE_ENV === 'production' ? 
            { maxAge : '1d' } :
            {}
        )
    )

    const session = require('./common/auth-mw')
    
    app.use( session.initSession )
    app.use('/pages', require('./components/pages'))
    app.use('/api', require('./components/api'))
    app.get('/', (req, res) => res.redirect('/pages/article/list'))
    app.get('/login', (req, res) => res.redirect('/pages/user/login'))
    app.get('/admin', (req, res) => res.redirect('/pages/user/login'))


    //404 handler
    app.use( (req, res) => {
        //quando abrindo e fechando uma string com ` , você informa que esta aceita interpolação de
        //variáveis com ${}. Isto só é válido no ES6.
        res.status(404).send(`NADA ACHADO: ${req.method} ${req.url}`)
    })

    //iniciar o servidor só depois de ter conectado com o mysql
    let HTTP_PORT = process.env.APP_HTTP_PORT || 8020
    app.listen( HTTP_PORT , () => console.log('HTTP Server up at ' + HTTP_PORT) )    
}).catch( err => {
    console.error('Error when starting the server.')
    console.error(err)
    throw err
})
