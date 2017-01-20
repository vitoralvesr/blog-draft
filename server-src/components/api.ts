import bodyParser = require('body-parser')
import auth = require('@common/auth-mw')
import express = require('express')
const api = express.Router()

api.use(bodyParser.json())
api.use(auth.session)


api.use('/user', require('./user/api'))


api.use(auth.authGate)
// -- everything below is always session gated --


api.use('/article', global.$debugMw('article'), require('./article/api'))


api.use( (error, req, res, next) => {
    console.error(error)
    res.status(error.statusCode||500).send({
        error : {
            message : error.message
        }
    })
})


export = api