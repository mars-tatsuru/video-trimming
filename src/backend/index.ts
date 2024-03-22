import fastify from 'fastify'
import ffmpeg from 'fluent-ffmpeg'
import { promises as fsPromises } from 'fs'
import { trim } from 'lodash-es'
import { basename, join } from 'path'
import { cdate } from 'cdate'
import { load } from 'ts-dotenv'
import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  ListBucketsCommand
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { fromIni } from '@aws-sdk/credential-providers'

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
 * MERGE FUNCTIONS
 *******************************************************/
// function merge(prePath: string, inputPath: string) {
//   return new Promise<void>((resolve, reject) => {
//     const inputName = basename(inputPath) //sample.mp4

//     ffmpeg(prePath)
//       .input(inputPath)
//       .on('error', reject)
//       .on('start', () => {
//         console.log(`Start merging for ${inputName}`)
//       })
//       .on('end', () => {
//         console.log(`${inputName} merged`)
//         resolve()
//       })
//       .mergeToFile(join(FOLDERS.OUTPUT, inputName), FOLDERS.TEMP)
//   })
// }

// async function mergeAll() {
//   try {
//     const prerollFiles = await fsPromises.readdir(FOLDERS.PREROLL)

//     if (!isArray(prerollFiles) || prerollFiles.length === 0) {
//       throw new Error(EORRORS.PREROLL)
//     }

//     let preroll: string | undefined = undefined

//     // p is fileName( sample.mp4 ) not path
//     for (const p of prerollFiles) {
//       const apPath = join(FOLDERS.PREROLL, p) // preroll/sample.mp4
//       const stats = await fsPromises.stat(apPath) // return stats object
//       // Stats {
//       //   dev: 16777230,
//       //   mode: 33188,
//       //   nlink: 1,
//       //   uid: 501,
//       //   gid: 20,
//       //   rdev: 0,
//       //   blksize: 4096,
//       //   ino: 58533411,
//       //   size: 12040751,
//       //   blocks: 23520,
//       //   atimeMs: 1710483289658.244,
//       //   mtimeMs: 1709817703566.6355,
//       //   ctimeMs: 1710483335736.4458,
//       //   birthtimeMs: 1709817703003.4377,
//       //   atime: 2024-03-15T06:14:49.658Z,
//       //   mtime: 2024-03-07T13:21:43.567Z,
//       //   ctime: 2024-03-15T06:15:35.736Z,
//       //   birthtime: 2024-03-07T13:21:43.003Z
//       // }

//       if (!stats.isDirectory()) {
//         preroll = apPath
//         break
//       }
//     }

//     if (isEmpty(preroll)) {
//       throw new Error(EORRORS.PREROLL)
//     }

//     const inputFiles = await fsPromises.readdir(FOLDERS.INPUT)

//     if (!isArray(inputFiles) || inputFiles.length === 0) {
//       throw new Error(EORRORS.INPUT)
//     }

//     for (const i of inputFiles) {
//       const iPath = join(FOLDERS.INPUT, i) // input/sample.mp4
//       const stat = await fsPromises.stat(iPath) // return stats object

//       if (!stat.isDirectory()) {
//         await merge(<string>preroll, iPath)
//       }
//     }
//   } catch (err) {
//     onError(err as Error)
//   }
// }

/*******************************************************
 * TRIM FUNCTIONS
 *******************************************************/
async function trimVideo(inputPath: string, startTime: string, endTime: string) {
  return new Promise<string>((resolve, reject) => {
    const inputName = basename(inputPath) //sample.mp4

    ffmpeg(inputPath)
      .inputOptions([`-ss ${startTime}`, `-t ${endTime}`])
      .outputOptions(['-c copy'])
      .on('error', reject)
      .on('start', () => {
        console.log(`Start trimming for ${inputName}`)
      })
      .on('end', () => {
        console.log(`${inputName} trimmed`)
        const outputPath = join(FOLDERS.OUTPUT, inputName)
        resolve(outputPath)
      })
      .save(join(FOLDERS.OUTPUT, inputName))
  })
}

export const mainFunction = async (
  videoName: string,
  videoCurrentTime: string,
  videoDuration: string
) => {
  try {
    // const inputFiles = await fsPromises.readdir(FOLDERS.INPUT)
    const inputFiles = [videoName]
    console.log('inputFiles', inputFiles)
    let trimmedVideoPath: string | undefined = undefined

    if (!isArray(inputFiles) || inputFiles.length === 0) {
      throw new Error(EORRORS.INPUT)
    }

    for (const i of inputFiles) {
      const iPath = join(FOLDERS.INPUT, i) // input/sample.mp4
      const stat = await fsPromises.stat(iPath) // return stats object

      if (!stat.isDirectory()) {
        trimmedVideoPath = await trimVideo(iPath, videoCurrentTime, videoDuration)
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
 *******************************************************************/
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

// export const getBucketContents = async () => {
//   const command = new ListObjectsV2Command({
//     Bucket: env.BUCKETNAME,
//     MaxKeys: 10
//   })

//   const bucket = await client.send(command)
//   const bucketContents = bucket.Contents?.map((content) => content.Key).join('\n')
//   console.log(bucketContents)
//   return bucket
// }

// https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/example_s3_PutObject_section.html
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
