import {Serializer} from '@greymass/eosio'
import {createLogger, resolveLevel} from 'bunyan'
import config from 'config'

const out = config.get('log.out') as string
const level = resolveLevel(config.get('log.level'))

const stream =
    out === 'stderr' || out === 'stdout' ? {stream: process[out], level} : {level, path: out}

const logger = createLogger({
    name: config.get('name'),
    streams: [stream],
    serializers: {
        proof: (proof) => Serializer.objectify(proof),
    },
})

export default logger
