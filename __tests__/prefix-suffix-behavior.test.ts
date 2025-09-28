import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { main } from '../src/index';

describe('Prefix and suffix behavior', () => {
  test('should use default prefix when neither prefix nor suffix specified', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const cssContent = 'body { color: red; }';
    const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;

    await fs.writeFile(join(tempDir, 'style.css'), cssContent);
    await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

    process.env.INPUT_PATHS = join(tempDir, 'test.html');
    process.env.INPUT_BASEDIR = tempDir;

    await main();

    const outputExists = await fs.access(join(tempDir, 'inlined-test.html')).then(() => true, () => false);
    expect(outputExists).toBe(true);

    await fs.rm(tempDir, { recursive: true });

    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_BASEDIR;
  });

  test('should not use default prefix when prefix is explicitly specified', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const cssContent = 'body { color: blue; }';
    const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;

    await fs.writeFile(join(tempDir, 'style.css'), cssContent);
    await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

    process.env.INPUT_PATHS = join(tempDir, 'test.html');
    process.env.INPUT_PREFIX = 'custom-';
    process.env.INPUT_BASEDIR = tempDir;

    await main();

    const outputExists = await fs.access(join(tempDir, 'custom-test.html')).then(() => true, () => false);
    expect(outputExists).toBe(true);

    await fs.rm(tempDir, { recursive: true });

    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_PREFIX;
    delete process.env.INPUT_BASEDIR;
  });

  test('should not use default prefix when suffix is explicitly specified', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const cssContent = 'body { color: green; }';
    const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;

    await fs.writeFile(join(tempDir, 'style.css'), cssContent);
    await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

    process.env.INPUT_PATHS = join(tempDir, 'test.html');
    process.env.INPUT_SUFFIX = '-processed';
    process.env.INPUT_BASEDIR = tempDir;

    await main();

    const outputExists = await fs.access(join(tempDir, 'test-processed.html')).then(() => true, () => false);
    expect(outputExists).toBe(true);

    await fs.rm(tempDir, { recursive: true });

    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_SUFFIX;
    delete process.env.INPUT_BASEDIR;
  });

  test('should use both when prefix and suffix are explicitly specified', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const cssContent = 'body { color: purple; }';
    const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;

    await fs.writeFile(join(tempDir, 'style.css'), cssContent);
    await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

    process.env.INPUT_PATHS = join(tempDir, 'test.html');
    process.env.INPUT_PREFIX = 'pre-';
    process.env.INPUT_SUFFIX = '-suf';
    process.env.INPUT_BASEDIR = tempDir;

    await main();

    const outputExists = await fs.access(join(tempDir, 'pre-test-suf.html')).then(() => true, () => false);
    expect(outputExists).toBe(true);

    await fs.rm(tempDir, { recursive: true });

    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_PREFIX;
    delete process.env.INPUT_SUFFIX;
    delete process.env.INPUT_BASEDIR;
  });
});