import express = require('express')
import mkdirp = require('mkdirp')
import glob = require('glob')
import path = require('path')
const sharp = require('sharp')
import bodyParser = require('body-parser')
import ono = require('ono')
import fs = require('fs')
import _ = require('lodash')

const rawBodyMw = bodyParser.raw({
    limit: '4MB'
})

const MEDIA_FOLDER = path.resolve(process.cwd(), '../user-content/media')
const THUMBNAIL_FOLDER = path.resolve( MEDIA_FOLDER , 'thumbnails' )
mkdirp.sync(MEDIA_FOLDER)
mkdirp.sync(THUMBNAIL_FOLDER)


//thumbnail generate
async function init() {
    let [[media], [thumbnail]] = await Promise.all([
        $promisify(glob, MEDIA_FOLDER + '/*.{jpg,jpeg,png,gif}'),
        $promisify(glob, THUMBNAIL_FOLDER + '/*.{jpg,jpeg,png,gif}')
    ])
    media = media.map(file => path.relative(MEDIA_FOLDER, file))
    thumbnail = thumbnail.map(file => path.relative(THUMBNAIL_FOLDER, file))
    let find = _.difference(media, thumbnail)
    if (find.length) $log('Generating', find.length, 'missing media thumbnails.')
    let all = find.map(thumbnailGenerate)
    await Promise.all(all)
    if (find.length) $log('Thumbnails updated.')
}
init()


const files = express.Router()
export = files

var __fileList : string[]
async function fileList() {
    if (__fileList) return __fileList
    var [resp] = await $promisify(glob, `${MEDIA_FOLDER}/*.{jpg,JPG,jpeg,JPEG,png,PNG,gif,GIF}`)
    __fileList = resp.map(file => {
        return path.relative(MEDIA_FOLDER, file)
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
    if (['jpg', 'jpeg', 'png', 'gif'].indexOf(parsed.ext.toLowerCase().substr(1)) === -1)
        throw ono('Extensão não suportada.')    
    if (filename.indexOf('/') !== -1 || filename.startsWith('..') || filename.indexOf('\\') !== -1)        
        throw ono('Nome de arquivo inválido.')
}


var uploadfn : express.RequestHandler = async (req, res, next) => {
    try {
        var { filename } = req.params
        fileCheck(filename)
        var files = await fileList()
        var updating = false
        if (files.indexOf(filename) !== -1) {
            if (req.query.update || req.method.toUpperCase() === 'PUT') updating = true
            else throw ono('Um arquivo com o mesmo nome já existe.')
        }
        let toSave = path.resolve(MEDIA_FOLDER, filename)
        let pathTest = path.parse(toSave)
        if (pathTest.dir !== MEDIA_FOLDER) throw ono('Nome de arquivo inválido.')
        var img = sharp(req.body)
        let saveThumb = thumbnailGenerate(filename, img)
        let saveMain = $promisify(fs.writeFile, toSave, req.body)
        await Promise.all([saveThumb, saveMain])
        files.push(filename)
        res.status(200).send({ status : updating ? 'Updated existing file.' : 'Created new file.' })
    } catch (err) {
        next(err)
    }    
}
files.route('/:filename')
    .post(rawBodyMw, uploadfn)
    .put(rawBodyMw, uploadfn)
    

async function thumbnailGenerate(filename, sharpObj?) {
    sharpObj = sharpObj || sharp( path.resolve(MEDIA_FOLDER, filename) )
    var imgmeta = await sharpObj.metadata()
    var limit = 150
    let max = Math.max(imgmeta.width, imgmeta.height)
    var [neww, newh] = [Math.ceil(imgmeta.width / max * limit), Math.ceil(imgmeta.height / max * limit)]
    await sharpObj.resize(neww, newh).toFile( path.resolve( THUMBNAIL_FOLDER, filename) )
}


files.delete('/:filename', async (req, res, next) => { 
    try {
        var { filename } = req.params
        fileCheck(filename)
        var files = await fileList()
        let idx = files.indexOf(filename)
        if (idx === -1) throw ono('Este arquivo não existe.')        
        await Promise.all([
            $promisify(fs.unlink, path.resolve(MEDIA_FOLDER, filename)) ,
            $promisify(fs.unlink, path.resolve(THUMBNAIL_FOLDER, filename))            
        ])
        __fileList.splice(idx, 1)
        res.status(200).send({ status : 'OK' })
    } catch (err) {
        next(err)
    }
})