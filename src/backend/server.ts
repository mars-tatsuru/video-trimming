import fastify from 'fastify'
import multiPart from '@fastify/multipart'
import cors from '@fastify/cors'
import { mainFunction, postDataToBucket, transformMp4ToMp3 } from './index'

//TODO: 実際にサーバーに投げて、そこから動画を取得してトリミングする
// https://go-tech.blog/nodejs/ts-aws-sdk-s3/#index_id6
// https://supabase.com/docs/guides/storage/uploads/resumable-uploads
// https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html
// resumable uploads
// ffmpegはパスでいけない？？ https://lapoz-ai.com/blog/blog-026/

const server = fastify()
server.register(cors, {
  origin: '*'
})
server.register(multiPart, {
  attachFieldsToBody: 'keyValues',
  limits: {
    fileSize: 2147483648, // ファイルサイズの制限 (50MB)
    fieldSize: 2147483648 // フィールドサイズの制限 (50MB)
  }
})

/*******************************************************
 * CREATE SERVER
 *******************************************************/
server.get('/', async (request, reply) => {
  return 'application\n'
})

server.get('/ping', async (request, reply) => {
  return 'pong\n'
})

server.get('/trim', async (request: any, reply: any) => {
  try {
    const { videoName, videoTrimStartTime, videoTrimEndTime } = request.query
    const result = await mainFunction(videoName, videoTrimStartTime, videoTrimEndTime)

    reply.send({ result }) // return trimmedVideo path to frontend
  } catch (error: any) {
    reply.status(500).send({ error: error.message }) // return error to frontend
  }
})

server.post('/video', async (request: any, reply: any) => {
  try {
    const { VideoName } = request.query
    const fileData = await request.body.file

    const result = postDataToBucket(VideoName, fileData)
    reply.send({ result })
  } catch (error: any) {
    reply.status(500).send({ error: error.message })
  }

  return 'video\n'
})

server.get('/transform', async (request: any, reply: any) => {
  try {
    const { videoName } = request.query
    const result = await transformMp4ToMp3(videoName)
    reply.send({ result })
  } catch (error: any) {
    reply.status(500).send({ error: error.message })
  }
})

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})
