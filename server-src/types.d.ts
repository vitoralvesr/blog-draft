declare module NodeJS {
    interface Global {
        $rfr
        $debugMw
        $checkParams
        $log
        $promisify
        $connection
        $legacyConnection
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
    githubUser?
    githubRepo?
    githubPath?
}