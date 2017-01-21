import auth = require('@common/auth-mw')
import express = require('express')
import marked = require('marked')
const highlight = require( process.cwd() + "/../server-src/highlight.js")
import { connection as db } from '@common/database'

marked.setOptions({
    sanitize : true ,
    highlight: function (code) {
        return highlight.highlightAuto(code).value;
    }
})
var pages = express.Router()


pages.get('/list', async (req, res, next) => {
    try {
        let [rows] = await db.execute(`SELECT articles.*, users.display_name
            FROM articles LEFT JOIN users ON articles.user = users.id`
        )
        var all = rows.map(async row => {
            var content = await $promisify( marked, row.content )
            row.content = content
            return row
        })
        var rows2 = await Promise.all(all)
        res.render('v-list', {
            title : 'Blog' ,
            itens : rows2 
        })
    } catch (err) {
        next(err)
    }
})


pages.get('/new', auth.authGate, async (req, res, next) => {
    res.render('v-new', { title : 'Novo post' })
})


pages.get('/:pageId/edit', auth.authGate, async (req, res, next) => {
    try {
        if (!req.params.pageId) throw Error('Página não informada.')
        let [rows] = db.execute(
            'SELECT * FROM article WHERE id = ? LIMIT 1',
            [req.params.pageId])
        if (!rows.length) throw Error('Artigo não existe.')
        let article = rows[0]
        res.render('v-edit', { 
            title: 'Editando artigo' ,
            article
        })
    } catch (err) {
        next(err)
    }
})


module.exports = pages