"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMp4ToMp3 = exports.postDataToBucket = exports.mainFunction = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = require("fs");
const path_1 = require("path");
const ts_dotenv_1 = require("ts-dotenv");
const client_s3_1 = require("@aws-sdk/client-s3");
const stream_1 = require("stream");
const openai_1 = __importDefault(require("openai"));
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
    FILEPATH: String,
    OPENAI_KEY: String
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
const mainFunction = async (videoName, videoTrimStartTime, videoTrimEndTime) => {
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
        const inputFiles = [videoName];
        let trimmedVideoPath = undefined;
        if (!isArray(inputFiles) || inputFiles.length === 0) {
            throw new Error(EORRORS.INPUT);
        }
        for (const i of inputFiles) {
            const iPath = (0, path_1.join)(FOLDERS.INPUT, videoName); // input/~~~~.mp4
            const stat = await fs_1.promises.stat(iPath); // return stats object
            if (!stat.isDirectory()) {
                trimmedVideoPath = await trimVideo(iPath, videoTrimStartTime, videoTrimEndTime);
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
// TODO: https://docs.aws.amazon.com/ja_jp/AmazonS3/latest/userguide/mpu-upload-object.html
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
/*******************************************************
 * TRANSFORM MP4 TO MP3
 *******************************************************/
const openai = new openai_1.default({
    apiKey: env.OPENAI_KEY
});
const transcriptionWithWhisper = async (transformVideoPath) => {
    // Whisperモデルを使用してテキスト変換リクエストを送信
    let response;
    let response2;
    if (transformVideoPath === undefined) {
        console.log('path error');
        throw new Error(EORRORS.INPUT);
    }
    else {
        // FIXME: ここでエラーが発生する connect error
        try {
            response = await openai.audio.transcriptions.create({
                model: 'whisper-1',
                file: (0, fs_1.createReadStream)(transformVideoPath),
                language: 'ja'
            });
        }
        catch (err) {
            onError(err);
            console.error('connect error', err);
            return 'Error';
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
                    content: `
          文章を要約するAIになってください。\n\n
          [
            { whole: true, title: 'title', summary: 'Whole summary', tags: ['スポーツ', '事件', '健康', '教育'] },
            { whole: false, title: 'news title', summary: 'news section summary', tags: ['ニュース', '法律'] },
            { whole: false, title: 'news title', summary: 'news section summary', tags: ['ニュース', '教育'] }
          ] \n\n
          上記のようなjsonString形式で要約をお願いします。
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
            temperature: 0,
            max_tokens: 4000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });
    }
    // 変換されたテキストを出力
    console.log(response2.choices[0].message.content);
    return response2.choices[0].message.content;
};
const changeExtension = async (inputPath) => {
    const inputName = (0, path_1.basename)(inputPath); //~~~~~.mp4
    const outputName = (0, path_1.basename)(inputPath, '.mp4') + '.mp3'; //~~~~~.mp3
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
            .output(inputName)
            .noVideo() // Remove video stream
            .audioCodec('copy') // Use the same audio codec to avoid re-encoding
            .on('error', reject)
            .on('start', () => { })
            .on('end', () => {
            const outputPath = (0, path_1.join)(FOLDERS.OUTPUT, outputName);
            resolve(outputPath);
        })
            .save((0, path_1.join)(FOLDERS.OUTPUT, outputName));
    });
};
const transformMp4ToMp3 = async (videoName) => {
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
        const inputFiles = [videoName];
        let transformVideoPath = undefined;
        if (!isArray(inputFiles) || inputFiles.length === 0) {
            throw new Error(EORRORS.INPUT);
        }
        for (const i of inputFiles) {
            const iPath = (0, path_1.join)(FOLDERS.INPUT, videoName); // input/~~~~.mp4
            const stat = await fs_1.promises.stat(iPath); // return stats object
            if (!stat.isDirectory()) {
                transformVideoPath = await changeExtension(iPath);
            }
        }
        const text = await transcriptionWithWhisper(transformVideoPath);
        // textをarrayに変換。\nを削除
        const jsonString = text === null || text === void 0 ? void 0 : text.replace(/\n/g, '');
        const data = JSON.parse(jsonString);
        return { transformVideoPath, data };
    }
    catch (err) {
        onError(err);
        return 'Error';
    }
};
exports.transformMp4ToMp3 = transformMp4ToMp3;
