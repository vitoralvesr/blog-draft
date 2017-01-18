import nodemailer = require('nodemailer')
import marked = require('marked')
import request = require('request')
const { $promisify } = global

//use a 3rd-party email service like mailgun in production
var __transporter = nodemailer.createTransport({
    service : 'Hotmail' ,
    auth : {
        user : process.env.APP_EMAIL_USER ,
        pass : process.env.APP_EMAIL_PASS
    }
})

export function smtpMailer({ email, subject, content }) {
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


export async function mailer({ email, subject, content }) {
    var domain = process.env.APP_EMAIL_MAILGUN_DOMAIN
    var from = process.env.APP_EMAIL_FROMADDR
    var html = await $promisify( marked, content )
    var [stream, body] = await $promisify(request, {
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