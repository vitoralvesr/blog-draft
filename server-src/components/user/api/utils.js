const nodemailer = require('nodemailer')
const marked = require('marked')

//use a 3rd-party email service like mailgun in production
var __transporter = nodemailer.createTransport({
    service : 'Hotmail' ,
    auth : {
        user : process.env.APP_EMAIL_USER ,
        pass : process.env.APP_EMAIL_PASS
    }
})
function _mailer({ email, subject, content }) {
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
exports.mailer = _mailer