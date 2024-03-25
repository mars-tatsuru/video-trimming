import fastify from 'fastify'
import ffmpeg from 'fluent-ffmpeg'
import { promises as fsPromises, createWriteStream, WriteStream } from 'fs'
import { trim } from 'lodash-es'
import { basename, join } from 'path'
import { cdate } from 'cdate'
import { load } from 'ts-dotenv'
import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  ListBucketsCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'
import { fromIni } from '@aws-sdk/credential-providers'
import { Readable } from 'stream'

const server = fastify()

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
    FILEPATH: String
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

    // // 署名を60分間有効なURLを取得
    // FIXME: this is not working in this case.
    // const getPresignedUrl = async (
    //   bucket: string,
    //   key: string,
    //   expiresIn: number
    // ): Promise<string> => {
    //   const objectParams = {
    //     Bucket: bucket,
    //     Key: key
    //   }
    //   const url = await getSignedUrl(client, new GetObjectCommand(objectParams), { expiresIn })
    //   return url
    // }
    // const dataUrl = await getPresignedUrl(env.BUCKETNAME, `${env.FILEPATH}/${videoName}`, 60 * 60)

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
// const changeExtension = async (inputPath: string) => {
//   const inputName = basename(inputPath) //~~~~~.mp4
//   const outputName = trim(inputName, '.mp4') + '.mp3'
//   const outputPath = join(FOLDERS.OUTPUT, outputName)

//   return new Promise<string>((resolve, reject) => {
//     ffmpeg(inputPath)
//       .outputOptions(['-vn', '-acodec copy'])
//       .on('error', reject)
//       .on('start', () => {
//         // console.log(`Start transforming for ${inputName}`)
//       })
//       .on('end', () => {
//         // console.log(`${inputName} transformed`)
//         resolve(outputPath)
//       })
//       .save(outputPath)
//   })
// }

// export const transformMp4ToMp3 = async (videoName?: string) => {
//   try {
//     // if bucket === videoName, get AWS S3
//     const command = new GetObjectCommand({
//       Bucket: `${env.BUCKETNAME}`,
//       Key: `${env.FILEPATH}/${'sample.mp4'}`
//     })

//     // write video to input folder to trim by ffmpeg
//     const { Body } = await client.send(command)
//     const writer: WriteStream = createWriteStream(join(FOLDERS.INPUT, 'sample.mp4'))
//     if (Body instanceof Readable) {
//       await new Promise((resolve, reject) => {
//         Body.pipe(writer)
//         Body.on('end', resolve)
//         Body.on('error', reject)
//       })
//     }

//     const inputFiles = ['sample.mp4']
//     let trimmedVideoPath: string | undefined = undefined

//     if (!isArray(inputFiles) || inputFiles.length === 0) {
//       throw new Error(EORRORS.INPUT)
//     }

//     for (const i of inputFiles) {
//       const iPath = join(FOLDERS.INPUT, 'sample.mp4') // input/~~~~.mp4
//       const stat = await fsPromises.stat(iPath) // return stats object

//       if (!stat.isDirectory()) {
//         trimmedVideoPath = await changeExtension(iPath)
//       }
//     }

//     return trimmedVideoPath
//   } catch (err) {
//     onError(err as Error)
//     return 'Error'
//   }
// }
