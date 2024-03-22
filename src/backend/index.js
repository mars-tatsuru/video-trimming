"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postDataToBucket = exports.mainFunction = void 0;
const fastify_1 = __importDefault(require("fastify"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = require("fs");
const path_1 = require("path");
const ts_dotenv_1 = require("ts-dotenv");
const client_s3_1 = require("@aws-sdk/client-s3");
const stream_1 = require("stream");
const server = (0, fastify_1.default)();
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const FOLDERS = {
    PREROLL: './preroll',
    INPUT: './input',
    OUTPUT: './output',
    TEMP: './temp'
};
const EORRORS = {
    PREROLL: 'Please add a preroll video to the preroll folder',
    INPUT: 'Please add a video to the input folder'
};
/*******************************************************
 * ENVIRONMENT VARIABLES
 *******************************************************/
const env = (0, ts_dotenv_1.load)({
    AWS_ACCESS_KEY_ID: String,
    AWS_SECRET_ACCESS_KEY: String,
    REGION: String,
    BUCKETNAME: String,
    FILEPATH: String
}, { path: '.env.local' });
const client = new client_s3_1.S3Client({
    region: env.REGION,
    credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    }
});
/*******************************************************
 * INITIALIZATION
 *******************************************************/
fluent_ffmpeg_1.default.setFfmpegPath(ffmpegPath);
fluent_ffmpeg_1.default.setFfprobePath(ffprobePath);
/*******************************************************
 * HELPER FUNCTIONS
 *******************************************************/
function isNil(obj) {
    return obj === null || obj === undefined;
}
function isEmpty(obj) {
    return isNil(obj) || obj === '';
}
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}
function onError(err) {
    if (isObject(err)) {
        console.error(err.message, '\n');
    }
    else {
        console.error(err, '\n');
    }
    process.exitCode = 1;
}
/*******************************************************
 * TRIM FUNCTIONS
 *******************************************************/
async function trimVideo(inputPath, startTime, endTime) {
    return new Promise((resolve, reject) => {
        const inputName = (0, path_1.basename)(inputPath); //~~~~~.mp4
        (0, fluent_ffmpeg_1.default)(inputPath)
            .inputOptions([`-ss ${startTime}`, `-t ${endTime}`])
            .outputOptions(['-c copy'])
            .on('error', reject)
            .on('start', () => {
            // console.log(`Start trimming for ${inputName}`)
        })
            .on('end', () => {
            // console.log(`${inputName} trimmed`)
            const outputPath = (0, path_1.join)(FOLDERS.OUTPUT, inputName);
            resolve(outputPath);
        })
            .save((0, path_1.join)(FOLDERS.OUTPUT, inputName));
    });
}
const mainFunction = async (videoName, videoCurrentTime, videoDuration) => {
    try {
        // if bucket === videoName, get AWS S3
        const command = new client_s3_1.GetObjectCommand({
            Bucket: `${env.BUCKETNAME}`,
            Key: `${env.FILEPATH}/${videoName}`
        });
        // write video to input folder to trim by ffmpeg
        const { Body } = await client.send(command);
        const writer = (0, fs_1.createWriteStream)((0, path_1.join)(FOLDERS.INPUT, videoName));
        if (Body instanceof stream_1.Readable) {
            await new Promise((resolve, reject) => {
                Body.pipe(writer);
                Body.on('end', resolve);
                Body.on('error', reject);
            });
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
        const inputFiles = [videoName];
        let trimmedVideoPath = undefined;
        if (!isArray(inputFiles) || inputFiles.length === 0) {
            throw new Error(EORRORS.INPUT);
        }
        for (const i of inputFiles) {
            const iPath = (0, path_1.join)(FOLDERS.INPUT, videoName); // input/~~~~.mp4
            const stat = await fs_1.promises.stat(iPath); // return stats object
            if (!stat.isDirectory()) {
                trimmedVideoPath = await trimVideo(iPath, videoCurrentTime, videoDuration);
            }
        }
        return trimmedVideoPath;
    }
    catch (err) {
        onError(err);
        return 'Error';
    }
};
exports.mainFunction = mainFunction;
/*******************************************************************
 * POST AWS S3
 * ref: https://qiita.com/taisuke101700/items/d7efaca27b33adf29833
 * ref: https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/example_s3_PutObject_section.html
 * ref: https://fukatsu.tech/ffmpeg-lambda-nodejs
 *******************************************************************/
// post data to s3 bucket(test-koike/video)
const postDataToBucket = async (VideoName, fileData) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: `${env.BUCKETNAME}`,
        Key: `${env.FILEPATH}/${VideoName}`,
        Body: fileData,
        ContentType: 'video/mp4'
    });
    try {
        const response = await client.send(command);
        return response;
    }
    catch (err) {
        onError(err);
        console.error(err);
    }
};
exports.postDataToBucket = postDataToBucket;
