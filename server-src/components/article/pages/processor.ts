import moment = require('moment')
import { config } from '@common/config'
import ono = require('ono')
import db = require('@common/database')
import marked = require('marked')

type showPostOpt = {
    skip?
    count?
    raw?
    id?
    slink?
    truncate?
    session
}
export async function _showPosts(opts: showPostOpt) {
    var filters = []
    var params = []
    
    //status filter
    var i1 = !(opts.id || opts.slink)
    if ( i1 || !opts.session.userId ) {
        filters.push('a.status = "published"')
    }    
    
    //by id
    opts.id = Number(opts.id)
    if (opts.id) {
        filters.push('a.id = ?')
        params.push(opts.id)
    }

    //by semantic link    
    var useSlink = !opts.id && opts.slink
    if (useSlink) {
        filters.push('a.slink = ?')
        params.push(opts.slink)
    }

    var contentQuery = (opts.truncate) ? 'a.trimmed_content AS content' : 'a.content'

    params.push(Number(opts.skip) || 0, Number(opts.count) || 5)
    if (opts.slink || opts.id) opts.count = 1

    let query = `SELECT
    a.id, a.slink, a.title, a.created, ${contentQuery}, a.markdown_break, u.display_name
        FROM articles a LEFT JOIN users u ON a.user = u.id
        WHERE ${filters.join(' AND ')}
        ORDER BY created DESC
        LIMIT ?, ?`

    let [rows] = await db.connection.execute(query, params)
    //raw is used for infinite scroll. In that case we don't want to append an error to the page.
    if (!rows.length && !opts.raw) throw ono('Nada encontrado.')
    //if we provide both a slink and an id, we use the id. But if then they dont match, discard.
    if (opts.id && opts.slink && opts.slink !== rows[0].slink) throw ono('Nada encontrado.')

    var all = rows.map(row => _processPost(row))
    var rows2 = await Promise.all(all)

    var view = '#vanilla/v-list'        
    var torender : any = {
        title : config.main_title ,
        items: rows2,
        $atRoot: true ,
        skipped: Number(opts.skip) || 0 ,
        noRoll: (opts.slink || opts.id) ? true : false,
        truncated : opts.truncate
    }

    if (opts.raw) {
        torender.layout = 'flat-layout'
        view = '#vanilla/v-list-partial'
    }
    return { view, torender }
}


async function _processPost(row) {
    var content = await $promisify(
        marked,
        (row.content||''),
        {
            sanitize: config.sanitize_markdown == true,
            breaks: row.markdown_break == true
        }
    )
    row.content = content
    row.formattedDate = moment(row.created).format(config.timestamp_format)
    row.userDisplayName = row.display_name
    return row
}