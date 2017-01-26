import express = require('express')
import mkdirp = require('mkdirp')
import glob = require('glob')

const MEDIA_FOLDER = process.cwd() + '../user-content/media'
mkdirp.sync( process.cwd() + '../user-content/media' )

const files = express.Router()
export = files


files.get('/list', async (req, res, next) => {
    try {
        var files = await $promisify(glob, `${MEDIA_FOLDER}/*.{jpg,jpeg,png,gif}`)
        var a = 0
        res.status(200).send()
    } catch (err) {

    }
})