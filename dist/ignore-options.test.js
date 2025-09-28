"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const html_inline_1 = require("./html-inline");
(0, node_test_1.test)('should skip CSS inlining when ignoreStyles is true', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-test-'));
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
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'), { ignoreStyles: true });
    const hasOriginalLink = result.includes('<link rel="stylesheet" href="style.css">');
    const hasInlineStyle = result.includes('<style>');
    (0, node_assert_1.strictEqual)(hasOriginalLink, true);
    (0, node_assert_1.strictEqual)(hasInlineStyle, false);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('should skip JavaScript inlining when ignoreScripts is true', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-test-'));
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
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'script.js'), jsContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'), { ignoreScripts: true });
    const hasOriginalScript = result.includes('<script src="script.js"></script>');
    const hasInlineScript = result.includes('<script>console.log("Hello");</script>');
    (0, node_assert_1.strictEqual)(hasOriginalScript, true);
    (0, node_assert_1.strictEqual)(hasInlineScript, false);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('should skip image inlining when ignoreImages is true', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-test-'));
    const imageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <img src="test.png" alt="test">
</body>
</html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.png'), imageData);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'), { ignoreImages: true });
    const hasOriginalSrc = result.includes('src="test.png"');
    const hasBase64DataUrl = result.includes('data:image/png;base64,');
    (0, node_assert_1.strictEqual)(hasOriginalSrc, true);
    (0, node_assert_1.strictEqual)(hasBase64DataUrl, false);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('should skip non-stylesheet link inlining when ignoreLinks is true', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-test-'));
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
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'favicon.ico'), iconData);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'), { ignoreLinks: true });
    const hasOriginalLink = result.includes('href="favicon.ico"');
    const hasDataUrl = result.includes('data:application/octet-stream;base64,');
    (0, node_assert_1.strictEqual)(hasOriginalLink, true);
    (0, node_assert_1.strictEqual)(hasDataUrl, false);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('should still inline stylesheets when ignoreLinks is true', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-test-'));
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
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'favicon.ico'), iconData);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'), { ignoreLinks: true });
    const hasInlineStyle = result.includes('<style>body { color: blue; }</style>');
    const hasOriginalIcon = result.includes('href="favicon.ico"');
    (0, node_assert_1.strictEqual)(hasInlineStyle, true);
    (0, node_assert_1.strictEqual)(hasOriginalIcon, true);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
