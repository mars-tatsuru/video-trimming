"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainFunction = void 0;
const fastify_1 = __importDefault(require("fastify"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = require("fs");
const path_1 = require("path");
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
async function trimVideo(inputPath, startTime, endTime) {
    return new Promise((resolve, reject) => {
        const inputName = (0, path_1.basename)(inputPath); //sample.mp4
        (0, fluent_ffmpeg_1.default)(inputPath)
            .inputOptions([`-ss ${startTime}`, `-t ${endTime}`])
            .outputOptions(['-c copy'])
            .on('error', reject)
            .on('start', () => {
            console.log(`Start trimming for ${inputName}`);
        })
            .on('end', () => {
            console.log(`${inputName} trimmed`);
            const outputPath = (0, path_1.join)(FOLDERS.OUTPUT, inputName);
            resolve(outputPath);
        })
            .save((0, path_1.join)(FOLDERS.OUTPUT, inputName));
    });
}
const mainFunction = async (videoName, videoCurrentTime, videoDuration) => {
    try {
        // const inputFiles = await fsPromises.readdir(FOLDERS.INPUT)
        const inputFiles = [videoName];
        console.log('inputFiles', inputFiles);
        let trimmedVideoPath = undefined;
        if (!isArray(inputFiles) || inputFiles.length === 0) {
            throw new Error(EORRORS.INPUT);
        }
        for (const i of inputFiles) {
            const iPath = (0, path_1.join)(FOLDERS.INPUT, i); // input/sample.mp4
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
