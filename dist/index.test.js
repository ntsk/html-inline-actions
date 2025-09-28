"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = require("node:assert");
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const index_1 = require("./index");
(0, node_test_1.test)('should process HTML files with prefix and suffix', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-action-test-'));
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
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    process.env.INPUT_PATHS = (0, path_1.join)(tempDir, 'test.html');
    process.env.INPUT_PREFIX = 'output-';
    process.env.INPUT_SUFFIX = '-inlined';
    process.env.INPUT_BASEDIR = tempDir;
    await (0, index_1.main)();
    const outputExists = await fs_1.promises.access((0, path_1.join)(tempDir, 'output-test-inlined.html')).then(() => true, () => false);
    (0, node_assert_1.strictEqual)(outputExists, true);
    const outputContent = await fs_1.promises.readFile((0, path_1.join)(tempDir, 'output-test-inlined.html'), 'utf-8');
    const hasInlineStyle = outputContent.includes('<style>body { margin: 0; }</style>');
    (0, node_assert_1.strictEqual)(hasInlineStyle, true);
    await fs_1.promises.rm(tempDir, { recursive: true });
    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_PREFIX;
    delete process.env.INPUT_SUFFIX;
    delete process.env.INPUT_BASEDIR;
});
(0, node_test_1.test)('should handle multiple paths', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-action-test-'));
    const cssContent = 'h1 { color: blue; }';
    const htmlContent1 = `<html><head><link rel="stylesheet" href="style.css"></head><body><h1>Page 1</h1></body></html>`;
    const htmlContent2 = `<html><head><link rel="stylesheet" href="style.css"></head><body><h1>Page 2</h1></body></html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'page1.html'), htmlContent1);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'page2.html'), htmlContent2);
    process.env.INPUT_PATHS = `${(0, path_1.join)(tempDir, 'page1.html')},${(0, path_1.join)(tempDir, 'page2.html')}`;
    process.env.INPUT_SUFFIX = '-processed';
    process.env.INPUT_BASEDIR = tempDir;
    await (0, index_1.main)();
    const output1Exists = await fs_1.promises.access((0, path_1.join)(tempDir, 'page1-processed.html')).then(() => true, () => false);
    const output2Exists = await fs_1.promises.access((0, path_1.join)(tempDir, 'page2-processed.html')).then(() => true, () => false);
    (0, node_assert_1.strictEqual)(output1Exists, true);
    (0, node_assert_1.strictEqual)(output2Exists, true);
    await fs_1.promises.rm(tempDir, { recursive: true });
    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_SUFFIX;
    delete process.env.INPUT_BASEDIR;
});
(0, node_test_1.test)('should overwrite original files when overwrite is true', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-action-test-'));
    const cssContent = 'h1 { font-size: 24px; }';
    const originalContent = `<html><head><link rel="stylesheet" href="style.css"></head><body><h1>Original</h1></body></html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'original.html'), originalContent);
    process.env.INPUT_PATHS = (0, path_1.join)(tempDir, 'original.html');
    process.env.INPUT_OVERWRITE = 'true';
    process.env.INPUT_BASEDIR = tempDir;
    await (0, index_1.main)();
    const outputContent = await fs_1.promises.readFile((0, path_1.join)(tempDir, 'original.html'), 'utf-8');
    const hasInlineStyle = outputContent.includes('<style>h1 { font-size: 24px; }</style>');
    (0, node_assert_1.strictEqual)(hasInlineStyle, true);
    const newFileExists = await fs_1.promises.access((0, path_1.join)(tempDir, 'original-inlined.html')).then(() => true, () => false);
    (0, node_assert_1.strictEqual)(newFileExists, false);
    await fs_1.promises.rm(tempDir, { recursive: true });
    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_OVERWRITE;
    delete process.env.INPUT_BASEDIR;
});
(0, node_test_1.test)('should use only prefix when suffix is empty', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-action-test-'));
    const cssContent = 'body { background: blue; }';
    const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    process.env.INPUT_PATHS = (0, path_1.join)(tempDir, 'test.html');
    process.env.INPUT_PREFIX = 'processed-';
    process.env.INPUT_SUFFIX = '';
    process.env.INPUT_BASEDIR = tempDir;
    await (0, index_1.main)();
    const outputExists = await fs_1.promises.access((0, path_1.join)(tempDir, 'processed-test.html')).then(() => true, () => false);
    (0, node_assert_1.strictEqual)(outputExists, true);
    await fs_1.promises.rm(tempDir, { recursive: true });
    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_PREFIX;
    delete process.env.INPUT_SUFFIX;
    delete process.env.INPUT_BASEDIR;
});
(0, node_test_1.test)('should use only suffix when prefix is empty', async () => {
    const tempDir = await fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'html-inline-action-test-'));
    const cssContent = 'body { margin: 10px; }';
    const htmlContent = `<html><head><link rel="stylesheet" href="style.css"></head><body>Test</body></html>`;
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'style.css'), cssContent);
    await fs_1.promises.writeFile((0, path_1.join)(tempDir, 'test.html'), htmlContent);
    process.env.INPUT_PATHS = (0, path_1.join)(tempDir, 'test.html');
    process.env.INPUT_PREFIX = '';
    process.env.INPUT_SUFFIX = '.processed';
    process.env.INPUT_BASEDIR = tempDir;
    await (0, index_1.main)();
    const outputExists = await fs_1.promises.access((0, path_1.join)(tempDir, 'test.processed.html')).then(() => true, () => false);
    (0, node_assert_1.strictEqual)(outputExists, true);
    await fs_1.promises.rm(tempDir, { recursive: true });
    delete process.env.INPUT_PATHS;
    delete process.env.INPUT_PREFIX;
    delete process.env.INPUT_SUFFIX;
    delete process.env.INPUT_BASEDIR;
});
