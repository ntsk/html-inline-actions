import { test } from 'node:test';
import { strictEqual } from 'node:assert';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { inlineHtml } from './html-inline';

test('should skip CSS inlining when ignoreStyles is true', async () => {
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

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { ignoreStyles: true });

  const hasOriginalLink = result.includes('<link rel="stylesheet" href="style.css">');
  const hasInlineStyle = result.includes('<style>');
  strictEqual(hasOriginalLink, true);
  strictEqual(hasInlineStyle, false);

  await fs.rm(tempDir, { recursive: true });
});

test('should skip JavaScript inlining when ignoreScripts is true', async () => {
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

  await fs.writeFile(join(tempDir, 'script.js'), jsContent);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { ignoreScripts: true });

  const hasOriginalScript = result.includes('<script src="script.js"></script>');
  const hasInlineScript = result.includes('<script>console.log("Hello");</script>');
  strictEqual(hasOriginalScript, true);
  strictEqual(hasInlineScript, false);

  await fs.rm(tempDir, { recursive: true });
});

test('should skip image inlining when ignoreImages is true', async () => {
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

  const result = await inlineHtml(join(tempDir, 'test.html'), { ignoreImages: true });

  const hasOriginalSrc = result.includes('src="test.png"');
  const hasBase64DataUrl = result.includes('data:image/png;base64,');
  strictEqual(hasOriginalSrc, true);
  strictEqual(hasBase64DataUrl, false);

  await fs.rm(tempDir, { recursive: true });
});

test('should skip non-stylesheet link inlining when ignoreLinks is true', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-test-'));

  const iconData = Buffer.from('fake-icon-data');
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <link rel="icon" href="favicon.ico">
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  await fs.writeFile(join(tempDir, 'favicon.ico'), iconData);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { ignoreLinks: true });

  const hasOriginalLink = result.includes('href="favicon.ico"');
  const hasDataUrl = result.includes('data:application/octet-stream;base64,');
  strictEqual(hasOriginalLink, true);
  strictEqual(hasDataUrl, false);

  await fs.rm(tempDir, { recursive: true });
});

test('should still inline stylesheets when ignoreLinks is true', async () => {
  const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-test-'));

  const cssContent = 'body { color: blue; }';
  const iconData = Buffer.from('fake-icon-data');
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
  <link rel="icon" href="favicon.ico">
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

  await fs.writeFile(join(tempDir, 'style.css'), cssContent);
  await fs.writeFile(join(tempDir, 'favicon.ico'), iconData);
  await fs.writeFile(join(tempDir, 'test.html'), htmlContent);

  const result = await inlineHtml(join(tempDir, 'test.html'), { ignoreLinks: true });

  const hasInlineStyle = result.includes('<style>body { color: blue; }</style>');
  const hasOriginalIcon = result.includes('href="favicon.ico"');
  strictEqual(hasInlineStyle, true);
  strictEqual(hasOriginalIcon, true);

  await fs.rm(tempDir, { recursive: true });
});