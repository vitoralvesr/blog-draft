import mysql = require('mysql2/promise')
import mysqlLegacy = require('mysql2')

export var connection: mysql.connection
export var legacyConnection: mysqlLegacy.connection

const connectionParams = {
    host : 'localhost' || process.env.APP_DB_HOST ,
    user : 'root' || process.env.APP_DB_USER ,
    database : 'test' || process.env.APP_DB_DB ,
    password : '' || process.env.APP_DB_PASS    
}

export async function init() {
    if (connection) return
    connection = await mysql.createConnection(connectionParams)
    legacyConnection = await mysqlLegacy.createConnection(connectionParams)
}
