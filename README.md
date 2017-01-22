# Startup

**Prerequisites**  
- node v6+. v4 maybe?
- mysql

**Quickstart**

On windows you need a working node-gyp for building bcrypt.
Achieve that by installing [the miraculous windows build tools](https://github.com/felixrieseberg/windows-build-tools).

- `npm i`  
- Run the database dump  (`init.sql`)
- Set the required environment variables (on VS code debugger, or creating a sh script, or using pm2, etc)  
  - you may just put placeholders on the email server ones.
- Compile typescript (`npm start tsc`)

Should be it. Run `node .`

# Configurable environment variables

> asterisk means required

## App

    APP_BASE_URL *
    APP_LIVERELOAD -- adds the livereload header

## Email

    APP_EMAIL_FROMADDR *
    APP_EMAIL_METHOD *

> Either one of the following options must be configured (or set up with a placeholder)

### SMTP Outlook Email

    APP_EMAIL_USER  
    APP_EMAIL_PASS  

### Mailgun

    APP_EMAIL_MAILGUN_KEY
    APP_EMAIL_MAILGUN_DOMAIN  