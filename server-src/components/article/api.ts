import express = require('express')
const api = express.Router()
import { connection as db, insert, simpleUpdate } from '@common/database'
//import { ArticleProvider } from './providers'

api.put('/:id?',  async (req, res, next) => {
    try {
        $checkParams(req.body, 'id')
        req.body.status = req.body.status || 'published'
        req.body.content = req.body.content || ''
        req.body.trimmed_content = (req.body.content || '').substr(0, 380)
        var fields = ['title', 'content', 'trimmed_content', 'status']
        if (req.body.created) {
            fields.push('created')
            req.body.created = new Date(req.body.created)
        }
        if (req.body.markdown_break !== undefined) fields.push('markdown_break')
        await simpleUpdate({
            fields,
            data: req.body,
            into: 'articles',
            id : req.body.id
        })
        res.status(200).send({ status: 'ok' })
    } catch (err) {
        next(err) 
    }    
})


api.post('/', async (req, res, next) => {
    try {
        $checkParams(req.body, 'title', 'source')
        req.body.status = req.body.status || 'published'
        if (req.body.source === 'git')
            $checkParams(req.body, 'githubUser', 'githubRepo', 'githubPath')
        req.body.user = Number(req.session.userId)
        req.body.trimmed_content = (req.body.content || '').substr(0, 380) + ' ...'
        var fields =  ['source', 'githubUser', 'githubRepo', 'githubPath',
            'title', 'content', 'user', 'trimmed_content', 'status']
        if (req.body.markdown_break !== undefined) fields.push('markdown_break')
        await insert({
            into: 'articles',
            fields ,
            data: req.body,
            camelCase : true
        })
        res.status(200).send({ status: 'ok' })
    } catch (err) {
        next(err)
    }    
})


api.post('/github-utf8', async (req, res, next) => {
    try {
        var { _content } = $checkParams(req.body, 'content')
        var utf8 = Buffer.from(_content, 'base64').toString('utf8')
        var escaped = global['escape'](encodeURIComponent(utf8))
        //var iso = iconv.decode(Buffer.from(utf8), 'ISO-8859-1')
        var dest = Buffer.from(escaped).toString('base64')
        res.status(200).send({ content: dest })
    } catch (err) {
        next(err)
    }
})


api.delete('/:id', async (req, res, next) => {
    try {
        $checkParams(req.params, 'id')
        await db.execute('DELETE FROM articles WHERE id = ?', [req.params.id])
        res.status(200).send({status : 'OK'})
    } catch (err) {
        next(err)
    }
})


api.get('/:id', async (req, res, next) => {
    try {
        $checkParams(req.params, 'id')
        let [rows] = await db.execute('SELECT * FROM articles WHERE id = ?', [req.params.id])
        res.status(200).send({ article : rows[0] })
    } catch (err) {
        next(err)
    }
})
 


/*
api.post('/verify-git', async (req, res, next) => { 
    try {
        var { _owner, _repository, _path  } =
            $checkParams(req.body, 'owner', 'repository', 'path')
        var reqParams = {
            method : 'GET' ,
            url : `https://api.github.com/repos/${_owner}/${_repository}/contents/${_path}`
        }
        request(reqParams).pipe(res)
    } catch (err) {
        next(err)
    }
})
*/

export = api