import express = require('express')
import { authGate } from '@common/auth-mw'
import config = require('@common/config')
import { connection as db } from '@common/database'

const admin = express.Router()
export = admin;


admin.use(authGate)


admin.get('/articles', async (req, res, next) => {
    try {
        //no mvc
        let [articles] = await db.execute(`SELECT
            id, title, trimmed_content
            FROM articles
            ORDER BY created DESC
            LIMIT 10`)
        res.render('v-articles', {
            layout: 'flat-layout',
            articles
        })
    } catch (err) {
        next(err)
    }
 })


admin.get('/config', (req, res) => {
    res.render('v-config', {
        layout: 'flat-layout' ,
        config : JSON.stringify(config.config)
    })
})


admin.get('/change-password', (req, res) => {
    res.render('v-change-password', {
        layout: 'flat-layout'
    })
})


admin.get('/', (req, res) => {  
    res.render('v-main', { title : 'Admin' })
})