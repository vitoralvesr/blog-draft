import { connection as db } from './database'

type keys = {
    new_account_button?
}
type keysList = keyof keys
export var config : keys

export async function init() {
    $log('Init configs.')
    set('new_account_button', '', true)

    let [rows] = await db.execute('SELECT * FROM config')
    config = rows.reduce((out, item) => {
        out[item.name] = item.value
        return out
    }, {})
}


export async function set(key: keysList, value: string, onlyIfNew?: boolean) {
    key  = <any>String(key).toLowerCase()
    if (onlyIfNew) {
        let [rows] = await db.execute('SELECT id FROM config WHERE name = ?', [key])
        if (rows.length) return
    }
    value = value || ''
    await db.execute('REPLACE INTO config(name, value) VALUES (?, ?)', [key, value])
    config[key] = value
}