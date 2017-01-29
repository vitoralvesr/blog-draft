import express = require('express')
import config = require('@common/config')
import { connection as db } from '@common/database'

const api = express.Router()
export = api


api.put('/config', async (req, res, next) => { 
    try {
        const fields = ['main_title', 'main_subtitle', 'timestamp_format', 'sanitize_markdown']
        $checkParams(req.body, ...fields)
        var all: Promise<any>[] = fields.map(field => {
            return config.set(<any>field, req.body[field])
        })
        await Promise.all(all)
        if (req.body.display_name) {
            await db.execute('UPDATE users SET display_name = ? WHERE id = ?',
                [req.body.display_name, req.session.userId || ''])
            req.session.userName = req.body.display_name
        }
        res.status(200).send({ status : 'OK' })
    } catch (err) {
        next(err)
    }
})