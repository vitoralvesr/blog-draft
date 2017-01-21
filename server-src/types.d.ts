declare var $debugMw
declare var $checkParams
declare var $log
declare var $promisify


declare module NodeJS {
    interface Global {
    }
}

declare namespace Express {
    //add custom items to session
    export interface Session {
        userId: number
        userName: string
    }

    //declare undocumented member    
    export interface Response {
        req : any
    }    
}  


type Article = {
    id
    title,
    content,
    source: 'mysql' | 'git'
    user
    githubUser?
    githubRepo?
    githubPath?
}


declare namespace MySql {
    export interface Connection {
        execute(query:string, params?:(string|number)[])
    }
}