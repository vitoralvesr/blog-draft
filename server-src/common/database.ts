import mysql = require('mysql2/promise')
import mysqlLegacy = require('mysql2')

export var connection: MySql.Connection
export var legacyConnection: MySql.Connection

const connectionParams = {
    host : '127.0.0.1' || process.env.APP_DB_HOST ,
    user : 'root' || process.env.APP_DB_USER ,
    database : 'blog-draft' || process.env.APP_DB_DB ,
    password : '' || process.env.APP_DB_PASS    
}

export async function init() {
    if (connection) return
    connection = await mysql.createConnection(connectionParams)
    legacyConnection = await mysqlLegacy.createConnection(connectionParams)
}


/**
 * mysql crashes the server if passed an undefined param
 */
export function fixObject(obj) {
    var out = {}
    for (var key in obj) {
        let val = obj[key]
        if (val === null || val === undefined) out[key] = ''
        else out[key] = val
    }
    return out
}