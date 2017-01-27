import express = require('express')
import mkdirp = require('mkdirp')
import glob = require('glob')
import path = require('path')
import bodyParser = require('body-parser')
import ono = require('ono')
import fs = require('fs')

const MEDIA_FOLDER = path.resolve( process.cwd() , '../user-content/media' )
mkdirp.sync( '../user-content/media' )

const files = express.Router()
export = files

var __fileList
async function fileList() {
    if (__fileList) return __fileList
    var [resp] = await $promisify(glob, `${MEDIA_FOLDER}/*.{jpg,jpeg,png,gif}`)
    __fileList = resp.map(file => {
        return path.relative(process.cwd() + '/../user-content/media', file)
    })
    return __fileList
}


files.get('/', async (req, res, next) => {
    try {
        let files = await fileList()
        res.status(200).send({ files })
    } catch (err) {
        next(err)
    }
})


function fileCheck(filename) {
    let parsed = path.parse(filename)
    if (['jpg', 'jpeg', 'png', 'gif'].indexOf(parsed.ext) === -1)
        throw ono('Extensão não suportada.')    
    if (filename.indexOf('/') !== -1 || filename.indexOf('..') !== -1 || filename.indexOf('\\') !== -1)        
        throw ono('Subpastas não são suportadas no momento.')
}


var uploadfn : express.RequestHandler = async (req, res, next) {
    try {
        var { filename } = req.params
        fileCheck(filename)
        var files = await fileList()
        var updating = false
        if (files.indexOf(filename) !== -1) {
            if (req.query.update || req.method.toUpperCase() === 'PUT') updating = true
            else throw ono('Um arquivo com o mesmo nome já existe.')
        }
        await $promisify( fs.writeFile, path.resolve( MEDIA_FOLDER , filename ), req.body )
        files.push(filename)
        res.status(200).send({ status : updating ? 'Updated existing file.' : 'Created new file.' })
    } catch (err) {
        next(err)
    }    
}
files.route('/:filename')
    .post(bodyParser.raw(), uploadfn)
    .put(bodyParser.raw(),  uploadfn)


files.delete('/:filename', async (req, res, next) => { 
    try {
        var { filename } = req.params
        fileCheck(filename)
        var files = await fileList()
        if (files.indexOf(filename) !== -1)
            throw ono('Este arquivo não existe.')        
        await $promisify(fs.unlink(path.resolve( MEDIA_FOLDER, filename )))
        res.status(200).send({ status : 'OK' })
    } catch (err) {
        next(err)
    }
})