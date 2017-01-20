const api = module.exports = require('express').Router()

import passwordGen = require('password-generator')
import bcrypt = require('bcrypt')
import ono = require('ono')
const connection = () => global.$connection
import auth = require('@common/auth-mw')
import uuid = require('uuid/v1')
import mailer = require('@common/mail')
const { $checkParams } = global

/**
 * Serviço de autenticação
 */
async function userLogin({ username, password, session }) {
    if (!username || !password) throw ono('Falta o nome de usuário ou senha.')
    if (session.userId) throw ono('Primeiro faça o logout da sessão atual.')

    let [rows] = await connection().execute('SELECT id, hash from `users` WHERE name = ?', [username])
    if (!rows.length) throw ono({statusCode:401}, 'Credenciais inválidas.')
    let _userId = rows[0].id
    let result = await bcrypt.compare(password, rows[0].hash)
    if (!result) throw ono({statusCode:401}, 'Credenciais inválidas.')
    session.userId = _userId
    session.userName = username
    return { status : 'OK' }
}


/**
 * Criar sessão
 */
api.post('/login', (req, res, next) => {
    userLogin({
        username : req.body.username ,
        password : req.body.password ,
        session : req.session
    }).then( resp => {
        res.status(200).send(resp)
    }).catch(next)
})


/**
 * Remover sessão.
 */
api.get('/logout', auth.authGate , (req, res, next) => {
    req.session.destroy( err => {
        if (err) return next(err)
        res.status(200).send({ status : 'OK' })
    })
})


api.passwordResetConfirm = function(_token) {
    return connection().execute(
        'SELECT id, user FROM event_tokens WHERE event = "password-reset-confirm" AND token = ?',
        [ _token ])
    .then(([rows]) => {
        if (!rows.length) throw Error('Falha ao encontrar token para esse pedido.')
        var userId = rows[0].user
        var eventId = rows[0].id
        let newpass = passwordGen(12)
        return bcrypt.hash(newpass, 10).then( newHash =>
            connection().execute('UPDATE users SET hash = ? WHERE id = ? ', [newHash, userId])
        )
        .then(() => connection().execute('DELETE FROM event_tokens WHERE id = ?', [eventId]) )
        .then(() => newpass)
    })
}


/**
 * Redefine senha a partir de um token de confimação.
 */
api.post('/password-reset-confirm', (req, res, next) => {
    Promise.resolve($checkParams(req.body, 'token'))
    .then(({_token}) => {
        return api.passwordResetConfirm(_token)
    }).then(newpass => {
        res.status(200).send({ password : newpass })
    })
    .catch(next)
})



/**
 * Adiciona um token de confirmação na BD
 */

api.post('/password-reset-request', (req, res, next) => {
    let _bytes, _userName, _userId
    Promise.resolve().then(() => {
        $checkParams(req.body, 'email')
        return connection()
        .execute(
            `SELECT u.id AS userId , u.name AS userName, ev.token AS token
                FROM 
                users u LEFT JOIN event_tokens ev ON u.id = ev.user
                WHERE u.email = ?`, 
            [req.body.email])
    })
    .then(([rows]) => {
        if (!rows.length) throw 'SKIP'
        if (rows[0].token) throw Error('Já existe um pedido pendente para este usuário.')
        _userName = rows[0].userName
        _userId = rows[0].userId
        _bytes = uuid()        
        return connection()
        .execute('INSERT INTO event_tokens(user, event, token) VALUES (?, ?, ?)',
            [_userId, 'password-reset-confirm', _bytes])
    }).then(() => {
        return mailer({
            email : req.body.email ,
            subject : 'Redefinição de senha' ,
            content : PWD_RESET_CONTENT(_userName, _bytes)
        })
    })
    .catch( err => {
        if (err === 'SKIP') return
        throw err
    })
    .then(() => {
        res.status(200).send({ token : _bytes })
    })
    .catch(next)
})

const PWD_RESET_CONTENT = (username, bytes) => (
`**Olá ${username}**,  
Acesse o link ${process.env.APP_BASE_URL}/pages/user/password-reset-confirm/${bytes}
para redefinir a sua senha.`
)



/**
 * Criar usuário
 */
api.post('/create', (req, res, next) => {
    let { username, email } = req.body    
    var _password
    Promise.resolve().then(() => {
        if (!username || !email) throw ono('Falta o nome de usuário ou o email.')
        _password = passwordGen(12)
        return bcrypt.hash(_password, 10)
    }).then( hash => {
        return connection().execute('INSERT into `users` (name, email, hash) VALUES (? , ?, ?)' ,
            [username, email, hash])
    }).then(() => {
        return mailer({ 
            email, 
            subject : 'Nova conta' ,
            content : `Essas são suas credenciais:\nNome de usuário: ${username}\nSenha: ${_password}`
        })
    }).then(() => {
        return userLogin({
            username ,
            password : _password ,
            session : req.session
        })
    }).then( loginResp => {
        res.status(200).send(loginResp||{status:'ok'})
    }).catch( err => {
        if (err.code === 'ER_DUP_ENTRY') throw ono(err, 'Já existe um ')
        throw err
    }).catch(next)
})


api.post('/password-change', auth.authGate, (req, res, next) => {
    var b = req.body //miss typescript
    Promise.resolve().then(()=>{
        $checkParams(b, 'currentPassword', 'newPassword', 'newPasswordConfirm')
        if (b.newPassword !== b.newPasswordConfirm) throw Error('As novas senhas devem bater.')
        return connection().execute('SELECT hash from users WHERE id = ?', [req.session.userId])            
    })
    .then( ([rows])  => {
        if (!rows.length) throw Error('Erro Inesperado!')
        return bcrypt.compare(b.currentPassword, rows[0].hash)
    })
    .then( result => {
        if (!result) throw Error('Senha incorreta.')
        return bcrypt.hash(b.newPassword, 10)
    })
    .then( hashed => {
        return connection().execute('UPDATE users SET hash = ? WHERE id = ?',
            [hashed, req.session.userId])
    })
    .then( () => {
        res.status(200).send({ status : 'OK' })
    })
    .catch(next)
})
