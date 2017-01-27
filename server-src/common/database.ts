import mysql = require('mysql2/promise')
import mysqlLegacy = require('mysql2')
import changeCase = require('change-case')
import mailer = require('./mail')

export var connection: MySql.Connection
//express-session wont work with mysql2/promise version...
export var legacyConnection: MySql.Connection

const connectionParams = {
    host : '127.0.0.1' || process.env.APP_DB_HOST ,
    user : 'root' || process.env.APP_DB_USER ,
    database : 'blog-draft' || process.env.APP_DB_DB ,
    password : '' || process.env.APP_DB_PASS    
}

export async function init() {
    if (connection) return
    connection = await mysql.createConnection(connectionParams);
    connection.connection.config.namedPlaceholders = true;
    legacyConnection = await mysqlLegacy.createConnection(connectionParams)
    connection.connection.on('error', async function (err) {
        $log('mysql err code', err && err.code)
        var closedState = String(err.message).endsWith('closed state')
        var connectionLost = String(err.message).startsWith('Connection lost')
        if (closedState || connectionLost) {
            console.error('mysql closed state error')
            mailer({
                email: 'wkrueger128@gmail.com',
                subject: 'Mysql error on server',
                content: JSON.stringify(err)
            })
            var conn = <any>connection
            await conn.close()
            await init()
        }
    })
}


type insertOpts = {
    fields: string[]
    data: any
    into: string,
    camelCase?: boolean
}
export async function insert(p: insertOpts) {
    var outFields = p.camelCase ?
        p.fields.map(item => changeCase.snakeCase(item)) :
        p.fields
    
    var values = outFields.map((current, idx) => { 
        let srcfield = p.fields[idx]
        return p.data[srcfield] || null
    })

    let query = `INSERT INTO ${p.into}(${outFields.join(',')})
        VALUES (${Array(values.length).fill('?').join(',')})`
    
    return connection.execute(query, values)
}