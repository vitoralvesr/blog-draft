const connection = () => $connection
var api = require('express').Router()

api.put('/:articleId', (req, res, next) => {
    return Promise.resolve().then( () => {
        $checkParams(req.params, 'articleId')
        return connection().execute(
            'UPDATE articles SET title = ?, content = ? WHERE id = ?',
            [req.body.title, req.body.content, req.params.articleId]
        )
    })
    .then(() => res.status(200).send( {status:'ok'} ))
    .catch(next)
})


module.exports = api