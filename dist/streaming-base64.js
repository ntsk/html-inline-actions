"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base64Transform = void 0;
exports.streamToBase64 = streamToBase64;
exports.createDataUrl = createDataUrl;
const stream_1 = require("stream");
const fs_1 = require("fs");
const stream_2 = require("stream");
const util_1 = require("util");
const pipelineAsync = (0, util_1.promisify)(stream_2.pipeline);
/**
 * A streaming Transform class that converts binary data to Base64 encoding in chunks.
 *
 * This implementation provides memory-efficient Base64 encoding for large files by processing
 * data in small chunks rather than loading entire files into memory. The class handles the
 * 3-byte boundary requirement of Base64 encoding by buffering incomplete chunks and carrying
 * them over to the next transformation cycle.
 */
class Base64Transform extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.remainder = Buffer.alloc(0);
    }
    _transform(chunk, encoding, callback) {
        // Concatenate previous remainder with new chunk
        const data = Buffer.concat([this.remainder, chunk]);
        // Base64 requires 3-byte chunks, so calculate processable length (multiple of 3)
        const processLength = Math.floor(data.length / 3) * 3;
        if (processLength > 0) {
            // Process the 3-byte aligned portion
            const processData = data.slice(0, processLength);
            this.push(processData.toString('base64'));
            // Save remainder for next chunk
            this.remainder = data.slice(processLength);
        }
        else {
            // If less than 3 bytes, save all as remainder
            this.remainder = data;
        }
        callback();
    }
    _flush(callback) {
        // Process any remaining bytes at the end (with padding)
        if (this.remainder.length > 0) {
            this.push(this.remainder.toString('base64'));
        }
        callback();
    }
}
exports.Base64Transform = Base64Transform;
async function streamToBase64(filePath) {
    return new Promise((resolve, reject) => {
        let base64Data = '';
        const base64Transform = new Base64Transform();
        base64Transform.on('data', (chunk) => {
            base64Data += chunk;
        });
        base64Transform.on('end', () => {
            resolve(base64Data);
        });
        base64Transform.on('error', reject);
        const readStream = (0, fs_1.createReadStream)(filePath);
        readStream.pipe(base64Transform);
        readStream.on('error', reject);
    });
}
async function createDataUrl(filePath, mimeType) {
    try {
        const base64Data = await streamToBase64(filePath);
        return `data:${mimeType};base64,${base64Data}`;
    }
    catch (error) {
        throw new Error(`Failed to create data URL for ${filePath}: ${error}`);
    }
}
