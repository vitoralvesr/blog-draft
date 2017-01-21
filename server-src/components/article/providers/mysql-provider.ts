import { ArticleProvider } from './index'
import db = require('@common/database')

export class MysqlProvider extends ArticleProvider {

    constructor(a:Article) {
        super(a)
        this._dbData = a
    }

    
    async update(article:Article) {
        return db.connection.execute(
            'UPDATE articles SET title = ?, content = ? WHERE id = ?',
            [article.title, article.content, article.id]
        )
    }



    async create() {
        var d = this._dbData
        return db.connection.execute(
            `INSERT INTO
                articles(source, github_user, github_repo, github_path, title, content, user)
                VALUES (? ,?, ?, ?, ?, ?, ?)`,
            [d.source, d.githubUser || '', d.githubRepo || '', d.githubPath || '', d.title,
                d.content, d.user]
        )
    }


    async get() {
        return this._dbData
    }


    async delete() {
        if (!this._dbData.id) throw Error('Faltou passar o id.')
        return db.connection
            .execute(`DELETE FROM articles WHERE id = ?`, [this._dbData.id])
    }

}