import auth = require('@common/auth-mw')
import express = require('express')
import marked = require('marked')
const highlight = require( process.cwd() + "/../server-src/highlight.js")
import db = require('@common/database')
import moment = require('moment')
import { config } from '@common/config'
import ono = require('ono')

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
            truncate : true
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
            slink: req.params.slink
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
            id : req.params.pageId
        })
        res.render( view, torender )
    } catch (err) {
        next(err)
    }
})


module.exports = pages


// ----


type showPostOpt = {
    skip?
    count?
    raw?
    id?
    slink?
    truncate?
}
async function _showPosts(opts: showPostOpt) {
    var filters = []
    var params = []
    
    //status filter
    if (!(opts.id || opts.slink)) {
        filters.push('a.status = "published"')
    }    
    
    //by id
    opts.id = Number(opts.id)
    if (opts.id) {
        filters.push('a.id = ?')
        params.push(opts.id)
    }

    //by semantic link    
    var useSlink = !opts.id && opts.slink
    if (useSlink) {
        filters.push('a.slink = ?')
        params.push(opts.slink)
    }

    var contentQuery = (opts.truncate) ? 'a.trimmed_content AS content' : 'a.content'

    params.push(Number(opts.skip) || 0, Number(opts.count) || 5)
    if (opts.slink || opts.id) opts.count = 1

    let query = `SELECT
    a.id, a.slink, a.title, a.created, ${contentQuery}, a.markdown_break, u.display_name
        FROM articles a LEFT JOIN users u ON a.user = u.id
        WHERE ${filters.join(' AND ')}
        ORDER BY created DESC
        LIMIT ?, ?`

    let [rows] = await db.connection.execute(query, params)
    //raw is used for infinite scroll. In that case we don't want to append an error to the page.
    if (!rows.length && !opts.raw) throw ono('Nada encontrado.')
    //if we provide both a slink and an id, we use the id. But if then they dont match, discard.
    if (opts.id && opts.slink && opts.slink !== rows[0].slink) throw ono('Nada encontrado.')

    var all = rows.map(row => _processPost(row))
    var rows2 = await Promise.all(all)

    var view = 'v-list'        
    var torender : any = {
        title : config.main_title ,
        items: rows2,
        $atRoot: true ,
        skipped: Number(opts.skip) || 0 ,
        noRoll: (opts.slink || opts.id) ? true : false,
        truncated : opts.truncate
    }

    if (opts.raw) {
        torender.layout = 'flat-layout'
        view = 'v-list-partial'
    }
    return { view, torender }
}


async function _processPost(row) {
    var content = await $promisify(
        marked,
        (row.content||''),
        {
            sanitize: config.sanitize_markdown == true,
            breaks: row.markdown_break == true
        }
    )
    row.content = content
    row.formattedDate = moment(row.created).format(config.timestamp_format)
    row.userDisplayName = row.display_name
    return row
}