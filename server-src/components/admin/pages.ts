import express = require('express')
import { authGate } from '@common/auth-mw'

const admin = express.Router()
export = admin;


admin.use(authGate)


admin.get('/articles', (req, res) => {
    res.render('v-articles', { layout: 'flat-layout' })
 })


admin.get('/config', (req, res) => {
    res.render('v-config', { layout: 'flat-layout' })
})


admin.get('/', (req, res) => {  
    res.render('v-main', { title : 'Admin' })
})