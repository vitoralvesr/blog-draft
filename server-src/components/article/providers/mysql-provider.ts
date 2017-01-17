import { ArticleProvider } from './index'
const connection = () => global.$connection

export class MysqlProvider extends ArticleProvider {

    constructor(a:Article) {
        super(a)
        this._dbData = a
    }

    
    async update(article:Article) {
        return connection().execute(
            'UPDATE articles SET title = ?, content = ? WHERE id = ?',
            [article.title, article.content, article.id]
        )
    }


    async get() {
        return this._dbData
    }

}