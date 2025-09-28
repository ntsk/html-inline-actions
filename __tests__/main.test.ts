import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Import the main function from the bundled dist file
const { main } = await import('../dist/index.js');

describe('HTML Inline Actions', () => {
  test('should process HTML file with CSS, JS, and images', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const cssContent = 'body { color: red; }';
    const jsContent = 'console.log("Hello");';
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
  <script src="script.js"></script>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`;

    // Write test files
    await fs.writeFile(join(tempDir, 'style.css'), cssContent);
    await fs.writeFile(join(tempDir, 'script.js'), jsContent);
    await fs.writeFile(join(tempDir, 'index.html'), htmlContent);

    // Set environment variables for the action
    process.env.INPUT_PATHS = join(tempDir, 'index.html');
    process.env.INPUT_SUFFIX = '-processed';

    // Mock console.log to capture output
    const originalLog = console.log;
    const logMessages: string[] = [];
    console.log = (...args: any[]) => {
      logMessages.push(args.join(' '));
    };

    try {
      // Run the main function
      await main();

      // Check if output file was created
      const outputPath = join(tempDir, 'index-processed.html');
      const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(outputExists).toBe(true);

      if (outputExists) {
        const result = await fs.readFile(outputPath, 'utf-8');

        // Verify CSS was inlined
        expect(result).toContain('<style>body { color: red; }</style>');

        // Verify JS was inlined
        expect(result).toContain('<script>console.log("Hello");</script>');

        // Verify original link and script tags were removed
        expect(result).not.toContain('<link rel="stylesheet" href="style.css">');
        expect(result).not.toContain('<script src="script.js"></script>');
      }
    } finally {
      // Restore console.log
      console.log = originalLog;

      // Clean up
      await fs.rm(tempDir, { recursive: true });

      // Clean up environment variables
      delete process.env.INPUT_PATHS;
      delete process.env.INPUT_SUFFIX;
    }
  });

  test('should handle multiple files', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <h1>Test</h1>
</body>
</html>`;

    // Write test files
    await fs.writeFile(join(tempDir, 'page1.html'), htmlContent);
    await fs.writeFile(join(tempDir, 'page2.html'), htmlContent);

    // Set environment variables
    process.env.INPUT_PATHS = `${join(tempDir, 'page1.html')},${join(tempDir, 'page2.html')}`;
    process.env.INPUT_SUFFIX = '-processed';

    const originalLog = console.log;
    console.log = () => {}; // Suppress output

    try {
      await main();

      // Check if both output files were created
      const output1 = await fs.access(join(tempDir, 'page1-processed.html')).then(() => true).catch(() => false);
      const output2 = await fs.access(join(tempDir, 'page2-processed.html')).then(() => true).catch(() => false);

      expect(output1).toBe(true);
      expect(output2).toBe(true);
    } finally {
      console.log = originalLog;
      await fs.rm(tempDir, { recursive: true });
      delete process.env.INPUT_PATHS;
      delete process.env.INPUT_SUFFIX;
    }
  });

  test('should handle overwrite mode', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'));

    const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <h1>Original</h1>
</body>
</html>`;

    const originalPath = join(tempDir, 'original.html');
    await fs.writeFile(originalPath, htmlContent);

    process.env.INPUT_PATHS = originalPath;
    process.env.INPUT_OVERWRITE = 'true';

    const originalLog = console.log;
    console.log = () => {};

    try {
      await main();

      // File should be overwritten
      const result = await fs.readFile(originalPath, 'utf-8');
      expect(result).toContain('<h1>Original</h1>'); // Content should still be there

      // No additional files should be created
      const files = await fs.readdir(tempDir);
      expect(files).toHaveLength(1);
      expect(files[0]).toBe('original.html');
    } finally {
      console.log = originalLog;
      await fs.rm(tempDir, { recursive: true });
      delete process.env.INPUT_PATHS;
      delete process.env.INPUT_OVERWRITE;
    }
  });
});