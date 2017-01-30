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


var N_ARTICLES = 5

admin.get('/articles', async (req, res, next) => {
    try {
        //mvc é um padrão opressor imposto pela burguesia
        let [count_res] = await db.execute(`SELECT COUNT(id) AS cnt FROM articles`)
        let count = Number(count_res[0].cnt)|| 0
        let [articles] = await db.execute(`SELECT
            id, title, trimmed_content, created, status
            FROM articles
            ORDER BY created DESC
            LIMIT ?, ${N_ARTICLES}`, [Number(req.query.skip) || 0])
        articles = articles.map( article => {
            article.formattedDate = moment(article.created).format(config.config.timestamp_format)
            article.formattedContent = entities.encode(article.trimmed_content)
            article.isDraft = article.status == 'draft'
            return article
        })
        var torender : any = {
            layout: 'flat-layout',
            articles
        }
        let skip = Number(req.query.skip) || 0
        if (skip > 0) torender.prev = String(Math.max(skip - N_ARTICLES , 0))
        let next = skip + articles.length
        if (next < count) torender.next = next
        res.render('v-articles', torender)
    } catch (err) {
        next(err)
    }
 })


admin.get('/config', (req, res) => {
    var _config = <any>Object.assign({}, config.config)
    _config.allow_html = _config.sanitize_markdown == true ? false : true
    _config.display_name = req.session.userName
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