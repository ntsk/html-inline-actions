"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const html_inline_1 = require("./html-inline");
(0, node_test_1.test)('should inline CSS from link tag', async () => {
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
    const expectedOutput = `<!DOCTYPE html>
<html>
<head>
  <style>body { color: red; }</style>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'));
    (0, node_assert_1.strictEqual)(result.replace(/\s+/g, ' ').trim(), expectedOutput.replace(/\s+/g, ' ').trim());
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('should inline JavaScript from script tag', async () => {
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
    const expectedOutput = `<!DOCTYPE html>
<html>
<head>
  <script>console.log("Hello");</script>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'script.js'), jsContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'));
    (0, node_assert_1.strictEqual)(result.replace(/\s+/g, ' ').trim(), expectedOutput.replace(/\s+/g, ' ').trim());
    await fs_1.promises.rm(tempDir, { recursive: true });
});
(0, node_test_1.test)('should inline images as base64', async () => {
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
    const result = await (0, html_inline_1.inlineHtml)((0, path_1.join)(tempDir, 'test.html'));
    const isBase64DataUrl = result.includes('data:image/png;base64,');
    (0, node_assert_1.strictEqual)(isBase64DataUrl, true);
    await fs_1.promises.rm(tempDir, { recursive: true });
});
