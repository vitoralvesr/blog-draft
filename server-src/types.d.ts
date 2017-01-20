declare module NodeJS {
    interface Global {
        $debugMw
        $checkParams
        $log
        $promisify
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