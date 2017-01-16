const auth = $rfr('components/auth-mw')
const connection = () => $connection
const express = require('express')
const marked = require('marked')
const pygments = require('pygmentize-bundled')
marked.setOptions({
    sanitize : true ,
    highlight: function (code, lang, callback) {
        pygments({ lang: lang, format: 'html' }, code, (err, result) => {
            callback(err, result.toString());
        });
    }
})
var pages = express.Router()


pages.get('/list', (req, res, next) => {
    connection().execute('SELECT * FROM articles')
        .then(([rows]) => {
            var all = rows.map( row => {
                return $promisify( marked, row.content ).then( content => {
                    row.content = content
                    return row
                })
            })
            return Promise.all(all)
        }).then( rows => {
            res.render('v-list', {
                title : 'Lista de artigos' ,
                itens : rows ,
                '$online' : req.session.userId !== undefined ,
                '$userName' : req.session.userName
            })
        }).catch(next)
})


pages.get('/:pageId/edit', auth.authGate, (req, res, next) => {
    if (!req.params.pageId) return next(Error('Página não informada.'))
    connection().execute('SELECT * FROM articles WHERE id = ?', [req.params.pageId])
        .then(([rows]) => {
            if (!rows.length) throw Error('Artigo não encontrado.')
            let article = rows[0]
            res.render('v-edit', { 
                title: 'Editando artigo' ,
                article
            })
        })
        .catch(next)
})


module.exports = pages