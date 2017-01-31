# What's this?

This was a mere code sample. I then became a blog. It will turn into a CMS.

# Startup

**Prerequisites**  
- node v6+. v4 maybe?
- mysql

**Demo**

Demo version (no users/authentication) running at [this $1 domain](https://www.champison.top).

**Quickstart**

Get a tagged commit version (master is currently unstable).

On windows you need a working node-gyp for building bcrypt.
Achieve that by installing [the miraculous windows build tools](https://github.com/felixrieseberg/windows-build-tools).

- `npm i`  
- Run the database installs (`*.sql`) in order
- Set the required environment variables (on your editor debugger, or create a sh script, or use pm2, etc)  
  - you may just put placeholders on the email server ones.
- `cwd` MUST BE `./server-dist`
- Compile typescript (`npm start tsc`)

Should be it. Run `node .`

# Configurable environment variables

> asterisk means required

## App

    APP_BASE_URL *
    APP_LIVERELOAD -- adds the livereload header
    APP_DEMO_MODE  -- specify user id to be always logged in

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
