import express = require('express')
import { authGate } from '@common/auth-mw'
import config = require('@common/config')
import { connection as db } from '@common/database'
import moment = require('moment')
import { AllHtmlEntities } from 'html-entities'
const entities = new AllHtmlEntities()

const admin = express.Router()
export = admin;


admin.use(authGate)


admin.get('/articles', async (req, res, next) => {
    try {
        //mvc é um padrão opressor imposto pela burguesia
        let [articles] = await db.execute(`SELECT
            id, title, trimmed_content, created, status
            FROM articles
            ORDER BY created DESC
            LIMIT 10`)
        articles = articles.map( article => {
            article.formattedDate = moment(article.created).format(config.config.timestamp_format)
            article.formattedContent = entities.encode(article.trimmed_content)
            article.isDraft = article.status == 'draft'
            return article
        })
        res.render('v-articles', {
            layout: 'flat-layout',
            articles
        })
    } catch (err) {
        next(err)
    }
 })


admin.get('/config', (req, res) => {
    var _config = <any>Object.assign({}, config.config)
    _config.allow_html = _config.sanitize_markdown == true ? false : true
    res.render('v-config', {
        layout: 'flat-layout' ,
        config : JSON.stringify(_config)
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