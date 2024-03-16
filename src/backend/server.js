"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const index_1 = require("./index");
const server = (0, fastify_1.default)();
server.register(cors_1.default, {
    origin: '*'
});
/*******************************************************
 * CREATE SERVER
 *******************************************************/
server.get('/ping', async (request, reply) => {
    return 'pong\n';
});
server.get('/trim', async (request, reply) => {
    try {
        const { videoName, videoCurrentTime, videoDuration } = request.query;
        const result = await (0, index_1.mainFunction)(videoName, videoCurrentTime, videoDuration);
        console.log('result', result);
        reply.send({ result }); // return trimmedVideo path to frontend
    }
    catch (error) {
        reply.status(500).send({ error: error.message }); // return error to frontend
    }
});
server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
