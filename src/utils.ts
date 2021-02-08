import {IncomingMessage} from 'http'

export class HTTPError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
    }
}

export function readBody(request: IncomingMessage) {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        request.on('error', reject)
        request.on('data', (chunk) => {
            chunks.push(chunk)
        })
        request.on('end', () => {
            resolve(Buffer.concat(chunks))
        })
    })
}

export async function readJSON(request: IncomingMessage) {
    try {
        const data = await readBody(request)
        return JSON.parse(data.toString('utf8'))
    } catch (error) {
        throw new HTTPError(`Invalid JSON: ${error.message}`, 400)
    }
}
