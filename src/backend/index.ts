// https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
import fastify from 'fastify'
import ffmpeg from 'fluent-ffmpeg'
import { promises as fsPromises, createWriteStream, WriteStream, createReadStream } from 'fs'
import { basename, join } from 'path'
import { load } from 'ts-dotenv'
import {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
  CreateMultipartUploadCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'
import { fromIni } from '@aws-sdk/credential-providers'
import { Readable } from 'stream'
import OpenAI from 'openai'

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path

const FOLDERS = {
  PREROLL: './preroll',
  INPUT: './input',
  OUTPUT: './output',
  TEMP: './temp'
}

const EORRORS = {
  PREROLL: 'Please add a preroll video to the preroll folder',
  INPUT: 'Please add a video to the input folder'
}

/*******************************************************
 * ENVIRONMENT VARIABLES
 *******************************************************/
const env = load(
  {
    AWS_ACCESS_KEY_ID: String,
    AWS_SECRET_ACCESS_KEY: String,
    REGION: String,
    BUCKETNAME: String,
    FILEPATH: String,
    OPENAI_KEY: String
  },
  { path: '.env.local' }
)

const client = new S3Client({
  region: env.REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
})

/*******************************************************
 * INITIALIZATION
 *******************************************************/
ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

/*******************************************************
 * HELPER FUNCTIONS
 *******************************************************/
function isNil(obj: any): boolean {
  return obj === null || obj === undefined
}

function isEmpty(obj: any): boolean {
  return isNil(obj) || obj === ''
}

function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object'
}

function isArray(obj: any): boolean {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

function onError(err: Error) {
  if (isObject(err)) {
    console.error(err.message, '\n')
  } else {
    console.error(err, '\n')
  }

  process.exitCode = 1
}

/*******************************************************
 * TRIM FUNCTIONS
 *******************************************************/
async function trimVideo(inputPath: string, startTime: string, endTime: string) {
  return new Promise<string>((resolve, reject) => {
    const inputName = basename(inputPath) //~~~~~.mp4

    ffmpeg(inputPath)
      .inputOptions([`-ss ${startTime}`, `-t ${endTime}`])
      .outputOptions(['-c copy'])
      .on('error', reject)
      .on('start', () => {
        // console.log(`Start trimming for ${inputName}`)
      })
      .on('end', () => {
        // console.log(`${inputName} trimmed`)
        const outputPath = join(FOLDERS.OUTPUT, inputName)
        resolve(outputPath)
      })
      .save(join(FOLDERS.OUTPUT, inputName))
  })
}

export const mainFunction = async (
  videoName: string,
  videoTrimStartTime: string,
  videoTrimEndTime: string
) => {
  try {
    // if bucket === videoName, get AWS S3
    const command = new GetObjectCommand({
      Bucket: `${env.BUCKETNAME}`,
      Key: `${env.FILEPATH}/${videoName}`
    })

    // write video to input folder to trim by ffmpeg
    const { Body } = await client.send(command)
    const writer: WriteStream = createWriteStream(join(FOLDERS.INPUT, videoName))
    if (Body instanceof Readable) {
      await new Promise((resolve, reject) => {
        Body.pipe(writer)
        Body.on('end', resolve)
        Body.on('error', reject)
      })
    }

    const inputFiles = [videoName]
    let trimmedVideoPath: string | undefined = undefined

    if (!isArray(inputFiles) || inputFiles.length === 0) {
      throw new Error(EORRORS.INPUT)
    }

    for (const i of inputFiles) {
      const iPath = join(FOLDERS.INPUT, videoName) // input/~~~~.mp4
      const stat = await fsPromises.stat(iPath) // return stats object

      if (!stat.isDirectory()) {
        trimmedVideoPath = await trimVideo(iPath, videoTrimStartTime, videoTrimEndTime)
      }
    }

    return trimmedVideoPath
  } catch (err) {
    onError(err as Error)
    return 'Error'
  }
}

/*******************************************************************
 * POST AWS S3
 * ref: https://qiita.com/taisuke101700/items/d7efaca27b33adf29833
 * ref: https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/example_s3_PutObject_section.html
 * ref: https://fukatsu.tech/ffmpeg-lambda-nodejs
 *******************************************************************/

// post data to s3 bucket(test-koike/video)
// TODO: https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/mpu-upload-object.html
export const postDataToBucket = async (VideoName: string, fileData: Buffer) => {
  const command = new PutObjectCommand({
    Bucket: `${env.BUCKETNAME}`,
    Key: `${env.FILEPATH}/${VideoName}`,
    Body: fileData,
    ContentType: 'video/mp4'
  })

  try {
    const response = await client.send(command)
    return response
  } catch (err) {
    onError(err as Error)
    console.error(err)
  }
}

/*******************************************************
 * TRANSFORM MP4 TO MP3
 *******************************************************/
const openai = new OpenAI({
  apiKey: env.OPENAI_KEY
})

const transcriptionWithWhisper = async (transformVideoPath: string | undefined) => {
  // Whisperモデルを使用してテキスト変換リクエストを送信
  let response
  let response2
  if (transformVideoPath === undefined) {
    console.log('path error')
    throw new Error(EORRORS.INPUT)
  } else {
    // FIXME: ここでエラーが発生する connect error
    try {
      response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: createReadStream(transformVideoPath!),
        language: 'ja'
      })
    } catch (err) {
      onError(err as Error)
      console.error('connect error', err)
      return 'Error'
    }

    // TODO: プロンプトを変更する
    // TODO: 出力するjsonデータを考える
    // TODO: 出力する項目の揺らぎをなくす
    // TODO: 人間味のある文章にする
    response2 = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `文章を要約するAIになってください。
          [
            { title: 'news1', summary: 'lorem ipsum dolor sit amet' },
            { title: 'news2', summary: 'lorem ipsum dolor sit amet 2' }
          ]}
          このようなjsonで全てのデータをまとめて返してください。
          `
        },
        {
          role: 'user',
          content: `下記文章はニュース番組の音声データをテキスト化したものです。\n
          ${response.text} \n
          この文章をニュースごとに分けて、要約してください。
          `
        }
      ],
      temperature: 1,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    })
  }

  // 変換されたテキストを出力
  console.log(response2.choices[0].message.content)
  return response
}

const changeExtension = async (inputPath: string) => {
  const inputName = basename(inputPath) //~~~~~.mp4
  const outputName = basename(inputPath, '.mp4') + '.mp3' //~~~~~.mp3

  return new Promise<string>((resolve, reject) => {
    ffmpeg(inputPath)
      .output(inputName)
      .noVideo() // Remove video stream
      .audioCodec('copy') // Use the same audio codec to avoid re-encoding
      .on('error', reject)
      .on('start', () => {})
      .on('end', () => {
        const outputPath = join(FOLDERS.OUTPUT, outputName)
        resolve(outputPath)
      })
      .save(join(FOLDERS.OUTPUT, outputName))
  })
}

export const transformMp4ToMp3 = async (videoName: string) => {
  try {
    // if bucket === videoName, get AWS S3
    const command = new GetObjectCommand({
      Bucket: `${env.BUCKETNAME}`,
      Key: `${env.FILEPATH}/${videoName}`
    })

    // write video to input folder to trim by ffmpeg
    const { Body } = await client.send(command)
    const writer: WriteStream = createWriteStream(join(FOLDERS.INPUT, videoName))
    if (Body instanceof Readable) {
      await new Promise((resolve, reject) => {
        Body.pipe(writer)
        Body.on('end', resolve)
        Body.on('error', reject)
      })
    }

    const inputFiles = [videoName]
    let transformVideoPath: string | undefined = undefined

    if (!isArray(inputFiles) || inputFiles.length === 0) {
      throw new Error(EORRORS.INPUT)
    }

    for (const i of inputFiles) {
      const iPath = join(FOLDERS.INPUT, videoName) // input/~~~~.mp4
      const stat = await fsPromises.stat(iPath) // return stats object

      if (!stat.isDirectory()) {
        transformVideoPath = await changeExtension(iPath)
      }
    }

    const text = await transcriptionWithWhisper(transformVideoPath)

    return { transformVideoPath, text }
  } catch (err) {
    onError(err as Error)
    return 'Error'
  }
}
