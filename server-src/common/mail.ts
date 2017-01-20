import nodemailer = require('nodemailer')
import marked = require('marked')
import request = require('request')
const { $promisify } = global

let METHOD : string = process.env.APP_EMAIL.METHOD || ''
METHOD = String(METHOD).toUpperCase()

// init
var __choose
if (METHOD === 'SMTP') {
    var user = process.env.APP_EMAIL_USER
    var pass = process.env.APP_EMAIL_PASS
    if (!user || !pass) throw Error('Missing SMTP config env vars.')
    //use a 3rd-party email service like mailgun in production
    var __transporter = nodemailer.createTransport({
        service : 'Hotmail' ,
        auth: { user, pass }
    })
    __choose = smtp
} else if (METHOD === 'MAILGUN') {
    var domain = process.env.APP_EMAIL_MAILGUN_DOMAIN
    var from = process.env.APP_EMAIL_FROMADDR
    if (!domain || !from) throw Error('Missing mailgun config env vars.')    
    __choose = mailgun
} else {
    throw Error('Must specify an email method through APP_EMAIL_METHOD.')    
}


function smtp({ email, subject, content }) {
    return new Promise((resolve, reject) => {
        __transporter.sendMail({
            from : process.env.APP_EMAIL_USER ,
            to : email ,
            subject ,
            text : content,
            html : marked(content),
        }, (err, info) => {
            if (err) return reject(err)
            return resolve(info)
        })
    })
}


async function mailgun({ email, subject, content }) {
    var domain = process.env.APP_EMAIL_MAILGUN_DOMAIN
    var from = process.env.APP_EMAIL_FROMADDR
    var html = await $promisify( marked, content )
    var [, body] = await $promisify(request, {
        auth: {
            user: 'api',
            pass: process.env.APP_EMAIL_MAILGUN_KEY
        },
        url: `https://api.mailgun.net/v3/${domain}/messages`,
        json: {
            from,
            to: email,
            subject,
            text: content,
            html
        }
    })
    return body
}

type MailParams = { email, subject, content }
export = async function (params: MailParams) {
    return __choose(params)
}