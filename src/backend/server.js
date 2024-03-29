"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const cors_1 = __importDefault(require("@fastify/cors"));
const index_1 = require("./index");
//TODO: 実際にサーバーに投げて、そこから動画を取得してトリミングする
// https://go-tech.blog/nodejs/ts-aws-sdk-s3/#index_id6
// https://supabase.com/docs/guides/storage/uploads/resumable-uploads
// https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html
// resumable uploads
// ffmpegはパスでいけない？？ https://lapoz-ai.com/blog/blog-026/
const server = (0, fastify_1.default)();
server.register(cors_1.default, {
    origin: '*'
});
server.register(multipart_1.default, {
    attachFieldsToBody: 'keyValues',
    limits: {
        fileSize: 2147483648, // ファイルサイズの制限 (50MB)
        fieldSize: 2147483648 // フィールドサイズの制限 (50MB)
    }
});
/*******************************************************
 * CREATE SERVER
 *******************************************************/
server.get('/', async (request, reply) => {
    return 'application\n';
});
server.get('/ping', async (request, reply) => {
    return 'pong\n';
});
server.get('/trim', async (request, reply) => {
    try {
        const { videoName, videoTrimStartTime, videoTrimEndTime } = request.query;
        const result = await (0, index_1.mainFunction)(videoName, videoTrimStartTime, videoTrimEndTime);
        reply.send({ result }); // return trimmedVideo path to frontend
    }
    catch (error) {
        reply.status(500).send({ error: error.message }); // return error to frontend
    }
});
server.post('/video', async (request, reply) => {
    try {
        const { VideoName } = request.query;
        const fileData = await request.body.file;
        const result = (0, index_1.postDataToBucket)(VideoName, fileData);
        reply.send({ result });
    }
    catch (error) {
        reply.status(500).send({ error: error.message });
    }
    return 'video\n';
});
server.get('/transform', async (request, reply) => {
    try {
        const { videoName } = request.query;
        const result = await (0, index_1.transformMp4ToMp3)(videoName);
        reply.send({ result });
    }
    catch (error) {
        reply.status(500).send({ error: error.message });
    }
});
server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
