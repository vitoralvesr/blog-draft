import auth = require('@common/auth-mw')
import express = require('express')
import marked = require('marked')
const highlight = require( process.cwd() + "/../server-src/highlight.js")
import db = require('@common/database')
import moment = require('moment')
import { config } from '@common/config'

marked.setOptions({
    highlight: function (code) {
        return highlight.highlightAuto(code).value;
    }
})
var pages = express.Router()


pages.get('/list', async (req, res, next) => {
    try {
        let skip = Number(req.query.skip)
        let skipQuery = skip ? '?,' : ''
        let query = `SELECT articles.*, users.display_name
            FROM articles LEFT JOIN users ON articles.user = users.id
            WHERE articles.status = "published"
            ORDER BY created DESC
            LIMIT ${skipQuery}5`
        let params = skip ? [skip] : []
        let [rows] = await db.connection.execute( query, params )
        var all = rows.map(async row => {
            var content = await $promisify(
                marked,
                row.content||'',
                {
                    sanitize: config.sanitize_markdown == true,
                    breaks: row.markdown_break == true
                }
            )
            row.content = content
            row.formattedDate = moment(row.created).format(config.timestamp_format)
            row.userDisplayName = row.display_name
            return row
        })
        var rows2 = await Promise.all(all)

        var view = 'v-list'        
        var torender : any = {
            title : config.main_title ,
            items: rows2,
            $atRoot: true ,
            skipped : (skip || 0)
        }

        if (req.query.raw) {
            torender.layout = 'flat-layout'
            view = 'v-list-partial'
        }

        res.render(view, torender)
    } catch (err) {
        next(err)
    }
})


pages.get('/new', auth.authGate, async (req, res, next) => {
    res.render('v-new', {
        title: 'Novo post',
        $scripts: [ '/assets/editor/editor.js' ]        
    })
})


pages.get('/:pageId/edit', auth.authGate, async (req, res, next) => {
    try {
        if (!req.params.pageId) throw Error('Página não informada.')
        let [rows] = await db.connection.execute(
            'SELECT * FROM articles WHERE id = ? LIMIT 1',
            [req.params.pageId])
        if (!rows.length) throw Error('Artigo não existe.')
        let article = rows[0]
        res.render('v-edit', { 
            title: 'Editando artigo :: ' + article.title ,
            article,
            $scripts: ['/assets/editor/editor.js'],
            noLocalDraft : req.query.fresh ? '1' : ''
        })
    } catch (err) {
        next(err)
    }
})


module.exports = pages