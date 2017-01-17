const auth = global.$rfr('components/auth-mw')
import express = require('express')
import marked = require('marked')
import pygments = require('pygmentize-bundled')
const { $promisify } = global
import { ArticleProvider } from './providers'

marked.setOptions({
    sanitize : true ,
    highlight: function (code, lang, callback) {
        pygments({ lang: lang, format: 'html' }, code, (err, result) => {
            callback(err, String(result));
        });
    }
})
var pages = express.Router()


pages.get('/list', async (req, res, next) => {
    try {
        var rows = await ArticleProvider.list()
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
        var provider = await ArticleProvider.init(req.params.pageId)
        let article = await provider.get()
        res.render('v-edit', { 
            title: 'Editando artigo' ,
            article
        })
    } catch (err) {
        next(err)
    }
})


module.exports = pages