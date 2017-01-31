import auth = require('@common/auth-mw')
import express = require('express')
import marked = require('marked')
const highlight = require( process.cwd() + "/../server-src/highlight.js")
import db = require('@common/database')
import { _showPosts } from './processor'

marked.setOptions({
    highlight: function (code) {
        return highlight.highlightAuto(code).value;
    }
})
var pages = express.Router()


pages.get('/list', async (req, res, next) => {
    try {
        var { view, torender } = await _showPosts({
            skip: req.query.skip,
            count: req.query.count,
            raw: req.query.raw,
            truncate: true,
            session: req.session
        })
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



pages.get('/slink/:slink', async(req, res, next) => {
    try {
        var { view, torender } = await _showPosts({
            count: 1,
            id: req.query.id,
            slink: req.params.slink,
            session : req.session
        })
        res.render( view, torender )        
    } catch (err) {
        next(err)
    }
})


pages.get('/:pageId', async (req, res, next) => { 
    try { 
        var { view, torender } = await _showPosts({
            count: 1,
            id: req.params.pageId,
            session : req.session
        })
        res.render( view, torender )
    } catch (err) {
        next(err)
    }
})


module.exports = pages