import config from 'config'

import {API, APIClient, APIError} from '@greymass/eosio'
import {ChainId, IdentityProof} from 'eosio-signing-request'
import {createServer, IncomingMessage, ServerResponse} from 'http'

import logger from './logger'
import version from './version'
import Provider from './api-provider'
import {HTTPError, readJSON} from './utils'

const chains = (config.get('chain') as any[]).map(({name, id, node}) => ({
    name: name as string,
    id: ChainId.from(id),
    client: new APIClient({provider: new Provider(node)}),
}))

const httpServer = createServer(handleRequest)

function handleRequest(request: IncomingMessage, response: ServerResponse) {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST, OPTIONS')
        response.statusCode = request.method === 'OPTIONS' ? 200 : 405
        response.end()
        return
    }
    handlePost(request)
        .then((account) => {
            response.statusCode = 200
            response.setHeader('Content-Type', 'application/json')
            response.write(JSON.stringify(account))
            response.end()
        })
        .catch((error) => {
            if (error instanceof HTTPError) {
                logger.info(error, 'error handling post request')
                response.statusCode = error.statusCode
                response.write(error.message)
            } else {
                logger.error(error, 'unexpected error handling post request')
                response.statusCode = 500
                response.write('Internal server error')
            }
            response.end()
        })
}

async function handlePost(request: IncomingMessage) {
    let proof: IdentityProof
    if (request.headers['authorization']) {
        try {
            proof = IdentityProof.from(request.headers['authorization'])
        } catch (error) {
            throw new HTTPError(`Invalid proof: ${error.message}`, 400)
        }
    } else {
        const payload = await readJSON(request)
        if (payload.proof) {
            try {
                proof = IdentityProof.from(payload.proof)
            } catch (error) {
                throw new HTTPError(`Invalid proof: ${error.message}`, 400)
            }
        } else {
            throw new HTTPError('Proof missing', 400)
        }
    }
    logger.debug({proof}, 'Verifying proof')
    const chain = chains.find(({id}) => id.equals(proof.chainId))
    if (!chain) {
        throw new HTTPError('Unsupported chain', 400)
    }
    let account: API.v1.AccountObject
    try {
        account = await chain.client.v1.chain.get_account(proof.signer.actor)
    } catch (error) {
        if (error instanceof APIError && error.code === 0) {
            throw new HTTPError('No such account', 401)
        } else {
            throw error
        }
    }
    const auth = account.getPermission(proof.signer.permission).required_auth
    const valid = proof.verify(auth, account.head_block_time)
    logger.info(`proof ${valid ? 'valid' : 'invalid'} for ${account.account_name}`)
    if (!valid) {
        throw new HTTPError('Proof invalid or expired', 401)
    }
    return account
}

export async function main() {
    const port = Number.parseInt(config.get('port'))
    if (!Number.isFinite(port)) {
        throw new Error('Invalid port number')
    }
    logger.info({version}, 'starting')
    await new Promise<void>((resolve, reject) => {
        httpServer.listen(port, resolve)
        httpServer.once('error', reject)
    })
    logger.info({port}, 'server running')
}

if (module === require.main) {
    process.once('uncaughtException', (error) => {
        logger.fatal(error, 'Uncaught exception')
        process.exit(1)
    })
    main().catch((error) => {
        logger.fatal(error, 'Unable to start application')
        process.exit(1)
    })
}
