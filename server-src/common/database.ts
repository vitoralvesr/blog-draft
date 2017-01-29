import mysql = require('mysql2')
import changeCase = require('change-case')

export var rawConnection
export var connection : MySql.Connection

const connectionParams = (poolSize) => ({
    connectionLimit : poolSize ,
    host: '127.0.0.1' || process.env.APP_DB_HOST,
    user : 'root' || process.env.APP_DB_USER ,
    database : 'blog-draft' || process.env.APP_DB_DB ,
    password: '' || process.env.APP_DB_PASS,
    trace: false
})


export async function init() {
    if (rawConnection) return
    var pool = mysql.createPool(connectionParams(4))
    rawConnection = pool

    var boundQuery = pool.query.bind(pool)    
    connection = {
        async execute(...args) {
            return $promisify( boundQuery , ...args )
        }
    }
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

type updateOpts = {
    fields: string[]
    data: any
    into: string,
    id: number
}
export async function simpleUpdate(p: updateOpts) {
    let setPairs = p.fields.map(field => { 
        return `${field} = ?`
    })
    let values = p.fields.map(field => {
        let data = p.data[field]
        if (data === undefined) throw Error(`Update: field ${field} has no data.`)
        return data
    })
    values.push(Number(p.id)||'')
    let query = `UPDATE ${p.into} SET ${setPairs.join(' , ')} WHERE id = ?`
    return connection.execute(query, values)
}