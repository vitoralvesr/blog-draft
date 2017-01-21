import { connection as db } from './database'

export var ROLE_ADMIN_ID
export var ROLE_NEW_ID
export var USER_ADMIN_ID

export async function init() {
    $log('Init roles.')
    var [rows] = await db.execute('SELECT * FROM roles LIMIT 1', [])
    if (!rows.length) {
        $log('Initializing roles (first run)...')
        await db.execute('INSERT INTO roles(name, is_owner) VALUES ("Admin", 1)')
        await db.execute('INSERT INTO roles(name, is_new) VALUES("Novo usuário", 1)')
    }
    var [rows] = await db.execute('SELECT * FROM roles')
    rows.forEach(row => {
        if (row.is_owner) ROLE_ADMIN_ID = row.id
        else if (row.is_new) ROLE_NEW_ID = row.id
    })
    var [rows] = await db.execute('SELECT id FROM users WHERE role = ?', [ROLE_ADMIN_ID])
    if (rows.length) USER_ADMIN_ID = rows[0].id
}