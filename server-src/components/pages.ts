import express = require('express')
const pages = express()

//handlebars setup
import ehbs = require('express-handlebars')
pages.engine('.hbs', ehbs({
    extname: '.hbs' ,
    defaultLayout : 'main-layout' ,
    layoutsDir: '../server-src/components/_views/layouts',
    partialsDir: '../server-src/components/_views/partials'
}));
pages.set('view engine', '.hbs')
pages.set('views', '../server-src/components')


/**
 * Override res.render. Reroute views. Add global variables.
 */
const oldRender = pages.response.render
pages.response = <any>{
    __proto__ : pages.response ,
    render(this: express.Response, path, data = {}, ...params) {
        var session = this.req.session || {}
        let extendedParams = Object.assign(data, {
            $online : session.userId !== undefined ,
            $userName: session.userName,
            $liveReload: process.env.APP_LIVERELOAD > 0
        })
        let url = this.req.originalUrl.split('/').slice(1)
        if (path.charAt(0) === '@')
            return oldRender.bind(this)('_views/' + path.substr(1), extendedParams, ...params)
        if (url[0] !== 'pages')
            return oldRender.bind(this)(path, extendedParams, ...params)
        return oldRender.bind(this)( url[1] + '/' + path, extendedParams, ...params )
    }
}


//routes
pages.use('/article', require('./article/pages'))
pages.use('/user', require('./user/pages'))
pages.use('/admin', require('./admin/pages'))
pages.get('/', (req, res) => {
    res.redirect(req.originalUrl + '/article/list')
})


//error handler
pages.use( (error, req, res, next) => {
    if (error.code == 'UNAUTHORIZED')
        return res.redirect('/pages/login')

    console.error('Error on route ' + req.url, error)
    res.render('@error', { error })
})

export = pages