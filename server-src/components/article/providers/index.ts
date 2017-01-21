/**
 * Esse esquema de provider é que eu estava pensando na possibilidade de ter diferentes fontes
 * para um artigo. Logo desisti da idéia, mas o código continua aí pq não preciso realmente refatorar.
 */

import db = require('@common/database')


export abstract class ArticleProvider {

    protected _dbData: Article
    

    constructor(a: Article) { } 

    
    static async init<T extends ArticleProvider>(idOrArticle: number | Article)
    : Promise<T> {
        if (typeof idOrArticle === 'object') return end(idOrArticle)
        
        var [rows] = await db.connection
            .execute('SELECT * FROM articles WHERE ID = ?', [idOrArticle])
        if (!rows.length) throw Error('Artigo não encontrado.')
        return end(rows[0])

        function end(article:Article) {
            let MysqlProvider = require('./mysql-provider').MysqlProvider
            /*if (article.source === 'mysql' || !article.source)*/ return new MysqlProvider(article)
            //throw Error('Não esperado.')
        }    
    }
    

    static async list() : Promise<Article[]> {
        var [rows] = await db.connection.execute('SELECT * FROM articles ORDER BY created DESC')
        var all = rows.map(async row => {
            var provider = await ArticleProvider.init(row)
            return await provider.get()
        })
        let result : any[] = await Promise.all(all)
        return result
    }


    async abstract update(id)
    async abstract get(): Promise<Article>
    async abstract create(): Promise<void>
    async abstract delete(): Promise<void>

}