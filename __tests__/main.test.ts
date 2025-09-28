import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mock @actions/core before importing the main function
jest.unstable_mockModule('@actions/core', () => core)

// Dynamically import the main function after setting up mocks
const { main } = await import('../src/index.js')

describe('HTML Inline Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should process HTML file with CSS, JS, and images', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'))

    const cssContent = 'body { color: red; }'
    const jsContent = 'console.log("Hello");'
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
  <script src="script.js"></script>
</head>
<body>
  <h1>Test</h1>
</body>
</html>`

    // Write test files
    await fs.writeFile(join(tempDir, 'style.css'), cssContent)
    await fs.writeFile(join(tempDir, 'script.js'), jsContent)
    await fs.writeFile(join(tempDir, 'index.html'), htmlContent)

    // Mock @actions/core functions
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'paths':
          return join(tempDir, 'index.html')
        case 'prefix':
          return ''
        case 'suffix':
          return '-processed'
        default:
          return ''
      }
    })
    core.getBooleanInput.mockImplementation(() => false)

    // Keep console.log for debugging, don't mock it for now
    const originalLog = console.log

    try {
      // Run the main function
      await main()

      // Check if output file was created
      const outputPath = join(tempDir, 'index-processed.html')
      const outputExists = await fs
        .access(outputPath)
        .then(() => true)
        .catch(() => false)
      expect(outputExists).toBe(true)

      if (outputExists) {
        const result = await fs.readFile(outputPath, 'utf-8')

        // Verify CSS was inlined
        expect(result).toContain('<style>body { color: red; }</style>')

        // Verify JS was inlined
        expect(result).toContain('<script>console.log("Hello");</script>')

        // Verify original link and script tags were removed
        expect(result).not.toContain('<link rel="stylesheet" href="style.css">')
        expect(result).not.toContain('<script src="script.js"></script>')
      }
    } finally {
      // Restore console.log
      console.log = originalLog

      // Clean up
      await fs.rm(tempDir, { recursive: true })

      // Clean up environment variables
      delete process.env.INPUT_PATHS
      delete process.env.INPUT_SUFFIX
    }
  })

  test('should handle multiple files', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'))

    const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <h1>Test</h1>
</body>
</html>`

    // Write test files
    await fs.writeFile(join(tempDir, 'page1.html'), htmlContent)
    await fs.writeFile(join(tempDir, 'page2.html'), htmlContent)

    // Configure mock implementations
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'paths':
          return `${join(tempDir, 'page1.html')},${join(tempDir, 'page2.html')}`
        case 'prefix':
          return ''
        case 'suffix':
          return '-processed'
        default:
          return ''
      }
    })
    core.getBooleanInput.mockImplementation(() => false)

    const originalLog = console.log
    console.log = () => {} // Suppress output

    try {
      await main()

      // Check if both output files were created
      const output1 = await fs
        .access(join(tempDir, 'page1-processed.html'))
        .then(() => true)
        .catch(() => false)
      const output2 = await fs
        .access(join(tempDir, 'page2-processed.html'))
        .then(() => true)
        .catch(() => false)

      expect(output1).toBe(true)
      expect(output2).toBe(true)
    } finally {
      console.log = originalLog
      await fs.rm(tempDir, { recursive: true })
    }
  })

  test('should handle overwrite mode', async () => {
    const tempDir = await fs.mkdtemp(join(tmpdir(), 'html-inline-action-test-'))

    const htmlContent = `<!DOCTYPE html>
<html>
<body>
  <h1>Original</h1>
</body>
</html>`

    const originalPath = join(tempDir, 'original.html')
    await fs.writeFile(originalPath, htmlContent)

    // Configure mock implementations
    core.getInput.mockImplementation(name => {
      switch (name) {
        case 'paths':
          return originalPath
        case 'prefix':
          return ''
        case 'suffix':
          return ''
        default:
          return ''
      }
    })
    core.getBooleanInput.mockImplementation(name => {
      return name === 'overwrite'
    })

    const originalLog = console.log
    console.log = () => {}

    try {
      await main()

      // File should be overwritten
      const result = await fs.readFile(originalPath, 'utf-8')
      expect(result).toContain('<h1>Original</h1>') // Content should still be there

      // No additional files should be created
      const files = await fs.readdir(tempDir)
      expect(files).toHaveLength(1)
      expect(files[0]).toBe('original.html')
    } finally {
      console.log = originalLog
      await fs.rm(tempDir, { recursive: true })
      jest.restoreAllMocks()
    }
  })
})
