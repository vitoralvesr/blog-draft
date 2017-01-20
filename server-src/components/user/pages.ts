const pages = require('express').Router()
const api = require('./api')
import authMw = require('@common/auth-mw')

pages.get('/login', (req, res) => {
    res.render('v-login')
})


pages.get('/create', (req, res) => {
    res.render('v-create')
})


pages.get('/password-reset-request', (req, res) => {
    res.render('v-password-reset-request')
})


pages.get('/password-reset-confirm/:token', (req, res, next) => {
    var _token
    Promise.resolve().then(() => {
        ;({ _token } = global.$checkParams(req.params, 'token'))
        return api.passwordResetConfirm(_token)
    }).then( password => {
        //i shouldnt render the password unless maybe on https...
        res.render('v-password-reset-confirm', { password })
    })
    .catch(next)
})


pages.get('/password-change', authMw.authGate, (req, res, next) => {
    res.render('v-password-change')
})


module.exports = pages