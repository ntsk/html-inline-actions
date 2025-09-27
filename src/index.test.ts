import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { main } from './index';

test('should process HTML files with prefix and suffix', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

  const cssContent = 'body { margin: 0; }';
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  process.env.INPUT_PATHS = join(tempDir, 'test.html');
  process.env.INPUT_PREFIX = 'output-';
  process.env.INPUT_SUFFIX = '-inlined';
  process.env.INPUT_BASEDIR = tempDir;

  await main();

  const outputExists = await fs.access(join(tempDir, 'output-test-inlined.html')).then(() => true, () => false);
  strictEqual(outputExists, true);

  const outputContent = await fs.readFile(join(tempDir, 'output-test-inlined.html'), 'utf-8');
  const hasInlineStyle = outputContent.includes('<style>body { margin: 0; }</style>');
  strictEqual(hasInlineStyle, true);

  await fs.rm(tempDir, { recursive: true });

  delete process.env.INPUT_PATHS;
  delete process.env.INPUT_PREFIX;
  delete process.env.INPUT_SUFFIX;
  delete process.env.INPUT_BASEDIR;
});

test('should handle multiple paths', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

  const cssContent = 'h1 { color: blue; }';
  const htmlContent1 = `<html><head><link rel="stylesheet" href="style.css"></head><body><h1>Page 1</h1></body></html>`;
  const htmlContent2 = `<html><head><link rel="stylesheet" href="style.css"></head><body><h1>Page 2</h1></body></html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'page1.html'), htmlContent1);
  await fs.writeFile(join(tempDir, 'page2.html'), htmlContent2);

  process.env.INPUT_PATHS = `${join(tempDir, 'page1.html')},${join(tempDir, 'page2.html')}`;
  process.env.INPUT_SUFFIX = '-processed';
  process.env.INPUT_BASEDIR = tempDir;

  await main();

  const output1Exists = await fs.access(join(tempDir, 'page1-processed.html')).then(() => true, () => false);
  const output2Exists = await fs.access(join(tempDir, 'page2-processed.html')).then(() => true, () => false);

  strictEqual(output1Exists, true);
  strictEqual(output2Exists, true);

  await fs.rm(tempDir, { recursive: true });

  delete process.env.INPUT_PATHS;
  delete process.env.INPUT_SUFFIX;
  delete process.env.INPUT_BASEDIR;
});

test('should overwrite original files when overwrite is true', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

  const cssContent = 'h1 { font-size: 24px; }';
  const originalContent = `<html><head><link rel="stylesheet" href="style.css"></head><body><h1>Original</h1></body></html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'original.html'), originalContent);

  process.env.INPUT_PATHS = join(tempDir, 'original.html');
  process.env.INPUT_OVERWRITE = 'true';
  process.env.INPUT_BASEDIR = tempDir;

  await main();

  const outputContent = await fs.readFile(join(tempDir, 'original.html'), 'utf-8');
  const hasInlineStyle = outputContent.includes('<style>h1 { font-size: 24px; }</style>');
  strictEqual(hasInlineStyle, true);

  const newFileExists = await fs.access(join(tempDir, 'original-inlined.html')).then(() => true, () => false);
  strictEqual(newFileExists, false);

  await fs.rm(tempDir, { recursive: true });

  delete process.env.INPUT_PATHS;
  delete process.env.INPUT_OVERWRITE;
  delete process.env.INPUT_BASEDIR;
});

test('should use only prefix when suffix is empty', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

  const cssContent = 'body { background: blue; }';
  const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  process.env.INPUT_PATHS = join(tempDir, 'test.html');
  process.env.INPUT_PREFIX = 'processed-';
  process.env.INPUT_SUFFIX = '';
  process.env.INPUT_BASEDIR = tempDir;

  await main();

  const outputExists = await fs.access(join(tempDir, 'processed-test.html')).then(() => true, () => false);
  strictEqual(outputExists, true);

  await fs.rm(tempDir, { recursive: true });

  delete process.env.INPUT_PATHS;
  delete process.env.INPUT_PREFIX;
  delete process.env.INPUT_SUFFIX;
  delete process.env.INPUT_BASEDIR;
});

test('should use only suffix when prefix is empty', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

  const cssContent = 'body { margin: 10px; }';
  const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  process.env.INPUT_PATHS = join(tempDir, 'test.html');
  process.env.INPUT_PREFIX = '';
  process.env.INPUT_SUFFIX = '.processed';
  process.env.INPUT_BASEDIR = tempDir;

  await main();

  const outputExists = await fs.access(join(tempDir, 'test.processed.html')).then(() => true, () => false);
  strictEqual(outputExists, true);

  await fs.rm(tempDir, { recursive: true });

  delete process.env.INPUT_PATHS;
  delete process.env.INPUT_PREFIX;
  delete process.env.INPUT_SUFFIX;
  delete process.env.INPUT_BASEDIR;
});