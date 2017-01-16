const auth = require('./auth-mw')
const express = require('express')
let pages = express()

//handlebars setup
const ehbs = require('express-handlebars')
pages.engine('.hbs', ehbs({
    extname: '.hbs' ,
    defaultLayout : 'main-layout' ,
    layoutsDir : 'components/_views/layouts'
}));
pages.set('view engine', '.hbs')
pages.set('views', 'components')

const ExpressView = require('express/lib/view')

class OvrView extends ExpressView {
    resolve(path, file) {
        return super.resolve(path, file)
    }
}
pages.set('view', OvrView)

//override res.render
let oldRender = pages.response.render
pages.response = {
    __proto__ : pages.response ,
    render(path, ...params) {
        let url = this.req.originalUrl.split('/').slice(1)
        if (path.charAt(0) === '@') return oldRender.bind(this)( '_views/' + path.substr(1) , ...params )
        if (url[0] !== 'pages') return oldRender.bind(this)( path, ...params)
        return oldRender.bind(this)( url[1] + '/' + path + '.hbs', ...params )
    }
}


//routes
pages.use(auth.session)


pages.use('/article', require('./article/pages'))
pages.use('/user', require('./user/pages'))


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

module.exports = pages