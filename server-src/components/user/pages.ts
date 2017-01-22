import express = require('express')
const user = express.Router()
const api = require('./api')
import authMw = require('@common/auth-mw')
import roles = require('@common/roles')
import { config } from '@common/config'


user.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/')
    res.render('v-login', {
        //show new account button if theres no admin user or if the option is enabled
        showNewAccount: config.new_account_button || roles.USER_ADMIN_ID === undefined
    })
})


user.get('/create', (req, res) => {
    var send: any = {}
    if (roles.USER_ADMIN_ID === undefined) send.message = {
        title: 'Primeiro acesso',
        content: 'Ainda não existem usuários registrados. ' +
            'O primeiro usuário registrado recebe a permissão de admin.'
    }
    res.render('v-create', send)
})


user.get('/password-reset-request', (req, res) => {
    res.render('v-password-reset-request')
})


user.get('/password-reset-confirm/:token', (req, res, next) => {
    var _token
    Promise.resolve().then(() => {
        ;({ _token } = $checkParams(req.params, 'token'))
        return api.passwordResetConfirm(_token)
    }).then( password => {
        //i shouldnt render the password unless maybe on https...
        res.render('v-password-reset-confirm', { password })
    })
    .catch(next)
})


user.get('/password-change', authMw.authGate, (req, res, next) => {
    res.render('v-password-change', { title: 'Alterar senha' })
})


module.exports = user