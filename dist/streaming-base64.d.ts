import { Transform } from 'stream';
/**
 * A streaming Transform class that converts binary data to Base64 encoding in chunks.
 *
 * This implementation provides memory-efficient Base64 encoding for large files by processing
 * data in small chunks rather than loading entire files into memory. The class handles the
 * 3-byte boundary requirement of Base64 encoding by buffering incomplete chunks and carrying
 * them over to the next transformation cycle.
 */
export declare class Base64Transform extends Transform {
    private remainder;
    _transform(chunk: Buffer, encoding: string, callback: Function): void;
    _flush(callback: Function): void;
}
export declare function streamToBase64(filePath: string): Promise<string>;
export declare function createDataUrl(filePath: string, mimeType: string): Promise<string>;
