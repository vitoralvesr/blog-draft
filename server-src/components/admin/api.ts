import express = require('express')
import config = require('@common/config')

const api = express.Router()
export = api


api.put('/config', async (req, res, next) => { 
    try {
        const fields = ['main_title', 'main_subtitle', 'timestamp_format']
        $checkParams(req.body, ...fields)
        var all: Promise<any>[] = fields.map(field => {
            return config.set(<any>field, req.body[field])
        })
        await Promise.all(all)
        res.status(200).send({ status : 'OK' })
    } catch (err) {
        next(err)
    }
})