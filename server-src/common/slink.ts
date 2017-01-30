import { connection as db } from './database'

export async function init() {
    var [rows] = await db.execute('SELECT id, title FROM articles WHERE slink IS NULL OR LENGTH(slink) = 0')
    if (rows.length) $log('Creating semantic link names for ' + rows.length + ' articles.')
    rows = rows.map(row => {
        row.slink = createSlink(row.title)
        return row
    })
    await Promise.all(rows.map(row => { 
        return db.execute('UPDATE articles SET slink = ? WHERE id = ?', [row.slink, row.id])
    }))
}


export function createSlink(title: string) {
    return String(title).toLowerCase()
        .replace(/\s/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substr(0, 49)
}