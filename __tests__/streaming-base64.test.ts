import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Base64Transform, streamToBase64, createDataUrl } from '../src/streaming-base64';

describe('Streaming Base64', () => {
  test('Base64Transform should handle small chunks correctly', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'base64-test-'));

    // 12バイトのテストデータ（3の倍数）
    const testData = Buffer.from('Hello World!');
    const expectedBase64 = testData.toString('base64');

    const testFile = join(tempDir, 'test.bin');
    await fs.writeFile(testFile, testData);

    const result = await streamToBase64(testFile);

    expect(result).toBe(expectedBase64);

    await fs.rm(tempDir, { recursive: true });
  });

  test('Base64Transform should handle data not divisible by 3', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'base64-test-'));

    // 13バイトのテストデータ（3で割り切れない）
    const testData = Buffer.from('Hello World!!');
    const expectedBase64 = testData.toString('base64');

    const testFile = join(tempDir, 'test.bin');
    await fs.writeFile(testFile, testData);

    const result = await streamToBase64(testFile);

    expect(result).toBe(expectedBase64);

    await fs.rm(tempDir, { recursive: true });
  });

  test('Base64Transform should handle large files efficiently', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'base64-test-'));

    // 1MBのランダムデータを作成
    const largeData = Buffer.alloc(1024 * 1024);
    for (let i = 0; i < largeData.length; i++) {
      largeData[i] = Math.floor(Math.random() * 256);
    }

    const testFile = join(tempDir, 'large.bin');
    await fs.writeFile(testFile, largeData);

    const startTime = Date.now();
    const streamResult = await streamToBase64(testFile);
    const streamTime = Date.now() - startTime;

    // 検証用に従来方式でも処理
    const startTime2 = Date.now();
    const fileBuffer = await fs.readFile(testFile);
    const traditionalResult = fileBuffer.toString('base64');
    const traditionalTime = Date.now() - startTime2;

    expect(streamResult).toBe(traditionalResult);

    console.log(`Stream method: ${streamTime}ms, Traditional method: ${traditionalTime}ms`);

    // ストリーミング方式がメモリ効率的であることを確認
    // （実際のメモリ使用量測定は複雑なので、単純に結果が同じことを確認）

    await fs.rm(tempDir, { recursive: true });
  });

  test('createDataUrl should create proper data URL', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'base64-test-'));

    // 小さなPNG画像データ（1x1ピクセルの透明画像）
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testFile = join(tempDir, 'test.png');
    await fs.writeFile(testFile, pngData);

    const dataUrl = await createDataUrl(testFile, 'image/png');

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);

    // Base64部分を抽出して検証
    const base64Part = dataUrl.substring('data:image/png;base64,'.length);
    const decodedData = Buffer.from(base64Part, 'base64');

    expect(decodedData.equals(pngData)).toBe(true);

    await fs.rm(tempDir, { recursive: true });
  });

  test('Base64Transform should handle empty files', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'base64-test-'));

    const testFile = join(tempDir, 'empty.txt');
    await fs.writeFile(testFile, '');

    const result = await streamToBase64(testFile);

    expect(result).toBe('');

    await fs.rm(tempDir, { recursive: true });
  });

  test('Base64Transform should handle single byte files', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'base64-test-'));

    const testData = Buffer.from('A');
    const expectedBase64 = testData.toString('base64');

    const testFile = join(tempDir, 'single.txt');
    await fs.writeFile(testFile, testData);

    const result = await streamToBase64(testFile);

    expect(result).toBe(expectedBase64);

    await fs.rm(tempDir, { recursive: true });
  });
});