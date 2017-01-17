const connection = () => global.$connection
import express = require('express')
const api = express.Router()
import { ArticleProvider } from '../providers'

api.put('/', async (req, res, next) => {
    try {
        global.$checkParams(req.body, 'id')
        var provider = await ArticleProvider.init(req.body.id)
        await provider.update(req.body)
        res.status(200).send({ status: 'ok' })
    } catch (err) {
        next(err)
    }    
})


module.exports = api