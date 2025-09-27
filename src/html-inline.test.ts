import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { inlineHtml } from './html-inline';

test('should inline CSS from link tag', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-test-'));

  const cssContent = 'body { color: red; }';
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  const expectedOutput = `<!DOCTYPE html>
<html>
<head>
  <style>body { color: red; }</style>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { basedir: tempDir });

  strictEqual(result.replace(/\s+/g, ' ').trim(), expectedOutput.replace(/\s+/g, ' ').trim());

  await fs.rm(tempDir, { recursive: true });
});

test('should inline JavaScript from script tag', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-test-'));

  const jsContent = 'console.log("Hello");';
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="script.js"></script>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  const expectedOutput = `<!DOCTYPE html>
<html>
<head>
  <script>console.log("Hello");</script>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  await fs.writeFile(join(tempDir, 'script.js'), jsContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { basedir: tempDir });

  strictEqual(result.replace(/\s+/g, ' ').trim(), expectedOutput.replace(/\s+/g, ' ').trim());

  await fs.rm(tempDir, { recursive: true });
});

test('should inline images as base64', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-test-'));

  const imageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <img src="test.png" alt="test">
</body>
</html>`;

  await fs.writeFile(join(tempDir, 'test.png'), imageData);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { basedir: tempDir });

  const isBase64DataUrl = result.includes('data:image/png;base64,');
  strictEqual(isBase64DataUrl, true);

  await fs.rm(tempDir, { recursive: true });
});