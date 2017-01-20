import express = require('express')
const api = express.Router()
import { ArticleProvider } from '../providers'
const { $checkParams } = global

api.put('/:id?',  async (req, res, next) => {
    try {
        global.$checkParams(req.body, 'id')
        var provider = await ArticleProvider.init(req.body.id)
        await provider.update(req.body)
        res.status(200).send({ status: 'ok' })
    } catch (err) {
        next(err) 
    }    
})


api.post('/', async (req, res, next) => {
    try {
        global.$checkParams(req.body, 'title', 'source')
        if (req.body.source === 'git')
            $checkParams(req.body, 'githubUser', 'githubRepo', 'githubPath')
        var provider = await ArticleProvider.init(req.body)
        await provider.create()
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
        var provider = await ArticleProvider.init(req.params.id)
        await provider.delete()
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