import { connection as db } from './database'
import moment = require('moment')
moment.locale('pt-br')

type keys = {
    new_account_button
    timestamp_format
    main_title
    main_subtitle
    sanitize_markdown
}
type keysList = keyof keys
export var config : keys

export async function init() {
    $log('Init configs.')
    set('main_title', 'Blog', true)
    set('main_subtitle', 'Subtítulo', true)
    set('new_account_button', '', true)
    set('timestamp_format', 'D MMM YYYY', true)
    set('sanitize_markdown', '1', true)

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