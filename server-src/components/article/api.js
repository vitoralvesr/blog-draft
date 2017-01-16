const connection = () => $connection
var api = require('express').Router()

api.put('/article/:articleId', (req, res, next) => {
    if (!req.params.articleId) return next(Error('Falta o campo -id-.'))
    connection().execute(
        'UPDATE articles SET title = ?, content = ? WHERE id = ?',
        [req.body.title, req.body.content, req.params.articleId]
    )
    .then(() => res.status(200).send( {status:'ok'} ))
    .catch(next)
})


module.exports = api