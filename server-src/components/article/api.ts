import express = require('express')
const api = express.Router()
import { connection as db, fixObject } from '@common/database'
//import { ArticleProvider } from './providers'

api.put('/:id?',  async (req, res, next) => {
    try {
        $checkParams(req.body, 'id')
        //var provider = await ArticleProvider.init(req.body.id)
        //await provider.update(req.body)
        await db.execute(
            'UPDATE articles SET title = :title, content = :content WHERE id = :id',
            req.body
        )
        res.status(200).send({ status: 'ok' })
    } catch (err) {
        next(err) 
    }    
})


api.post('/', async (req, res, next) => {
    try {
        $checkParams(req.body, 'title', 'source')
        if (req.body.source === 'git')
            $checkParams(req.body, 'githubUser', 'githubRepo', 'githubPath')
        req.body.user = Number(req.session.userId)
        await db.execute(`INSERT INTO
                articles(source, github_user, github_repo, github_path, title, content, user)
                VALUES (:source ,:githubUser, :githubRepo, :githubPath, :title, :content, :user)`,
            fixObject(req.body)
        )
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
        db.execute('DELETE FROM article WHERE id = ?', [req.params.id])
        res.status(200).send({status : 'OK'})
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