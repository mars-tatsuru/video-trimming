import fastify from 'fastify'
import cors from '@fastify/cors'
import { mainFunction } from './index'

const server = fastify()
server.register(cors, {
  origin: '*'
})

/*******************************************************
 * CREATE SERVER
 *******************************************************/
server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

server.get('/trim', async (request: any, reply: any) => {
  try {
    const { videoName, videoCurrentTime, videoDuration } = request.query
    const result = await mainFunction(videoName, videoCurrentTime, videoDuration)
    console.log('result', result)

    reply.send({ result }) // return trimmedVideo path to frontend
  } catch (error: any) {
    reply.status(500).send({ error: error.message }) // return error to frontend
  }
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
