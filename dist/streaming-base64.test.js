"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const streaming_base64_1 = require("./streaming-base64");
(0, node_test_1.test)('Base64Transform should handle small chunks correctly', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'base64-test-'));
    // 12バイトのテストデータ（3の倍数）
    const testData = Buffer.from('Hello World!');
    const expectedBase64 = testData.toString('base64');
    const testFile = (0, path_1.join)(tempDir, 'test.bin');
    await fs_1.promises.writeFile(testFile, testData);
    const result = await (0, streaming_base64_1.streamToBase64)(testFile);
    (0, node_assert_1.strictEqual)(result, expectedBase64);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('Base64Transform should handle data not divisible by 3', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'base64-test-'));
    // 13バイトのテストデータ（3で割り切れない）
    const testData = Buffer.from('Hello World!!');
    const expectedBase64 = testData.toString('base64');
    const testFile = (0, path_1.join)(tempDir, 'test.bin');
    await fs_1.promises.writeFile(testFile, testData);
    const result = await (0, streaming_base64_1.streamToBase64)(testFile);
    (0, node_assert_1.strictEqual)(result, expectedBase64);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('Base64Transform should handle large files efficiently', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'base64-test-'));
    // 1MBのランダムデータを作成
    const largeData = Buffer.alloc(1024 * 1024);
    for (let i = 0; i < largeData.length; i++) {
        largeData[i] = Math.floor(Math.random() * 256);
    }
    const testFile = (0, path_1.join)(tempDir, 'large.bin');
    await fs_1.promises.writeFile(testFile, largeData);
    const startTime = Date.now();
    const streamResult = await (0, streaming_base64_1.streamToBase64)(testFile);
    const streamTime = Date.now() - startTime;
    // 検証用に従来方式でも処理
    const startTime2 = Date.now();
    const fileBuffer = await fs_1.promises.readFile(testFile);
    const traditionalResult = fileBuffer.toString('base64');
    const traditionalTime = Date.now() - startTime2;
    (0, node_assert_1.strictEqual)(streamResult, traditionalResult);
    console.log(`Stream method: ${streamTime}ms, Traditional method: ${traditionalTime}ms`);
    // ストリーミング方式がメモリ効率的であることを確認
    // （実際のメモリ使用量測定は複雑なので、単純に結果が同じことを確認）
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('createDataUrl should create proper data URL', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'base64-test-'));
    // 小さなPNG画像データ（1x1ピクセルの透明画像）
    const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    const testFile = (0, path_1.join)(tempDir, 'test.png');
    await fs_1.promises.writeFile(testFile, pngData);
    const dataUrl = await (0, streaming_base64_1.createDataUrl)(testFile, 'image/png');
    (0, node_assert_1.ok)(dataUrl.startsWith('data:image/png;base64,'));
    // Base64部分を抽出して検証
    const base64Part = dataUrl.substring('data:image/png;base64,'.length);
    const decodedData = Buffer.from(base64Part, 'base64');
    (0, node_assert_1.ok)(decodedData.equals(pngData));
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('Base64Transform should handle empty files', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'base64-test-'));
    const testFile = (0, path_1.join)(tempDir, 'empty.txt');
    await fs_1.promises.writeFile(testFile, '');
    const result = await (0, streaming_base64_1.streamToBase64)(testFile);
    (0, node_assert_1.strictEqual)(result, '');
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('Base64Transform should handle single byte files', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'base64-test-'));
    const testData = Buffer.from('A');
    const expectedBase64 = testData.toString('base64');
    const testFile = (0, path_1.join)(tempDir, 'single.txt');
    await fs_1.promises.writeFile(testFile, testData);
    const result = await (0, streaming_base64_1.streamToBase64)(testFile);
    (0, node_assert_1.strictEqual)(result, expectedBase64);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
