import { promises as fs } from 'fs';
import { resolve, dirname, basename, extname, join } from 'path';
import { inlineHtml } from './html-inline.js';

/**
 * Parse input paths from GitHub Actions environment variable.
 * Supports both YAML array format and comma-separated string format.
 */
function parseInputPaths(pathsInput: string): string[] {
  if (!pathsInput) return [];

  try {
    // Try parsing as JSON array (GitHub Actions converts YAML arrays to JSON)
    const parsed = JSON.parse(pathsInput);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Fallback to comma-separated string (legacy support)
    return pathsInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }
}

/**
 * Find all HTML files in a directory recursively.
 */
async function findHtmlFiles(dirPath: string): Promise<string[]> {
  const htmlFiles: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findHtmlFiles(fullPath);
        htmlFiles.push(...subFiles);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory: ${dirPath}`, error);
  }

  return htmlFiles;
}

/**
 * Expand paths to include HTML files from directories.
 */
async function expandPaths(inputPaths: string[]): Promise<string[]> {
  const expandedPaths: string[] = [];

  for (const inputPath of inputPaths) {
    const resolvedPath = resolve(inputPath);

    try {
      const stat = await fs.stat(resolvedPath);

      if (stat.isDirectory()) {
        // If directory, find all HTML files
        const htmlFiles = await findHtmlFiles(resolvedPath);
        expandedPaths.push(...htmlFiles);
      } else if (stat.isFile()) {
        // If file, add as-is
        expandedPaths.push(resolvedPath);
      }
    } catch (error) {
      console.warn(`Path not found: ${inputPath}`);
    }
  }

  return expandedPaths;
}

export async function main(): Promise<void> {
  try {
    const paths = process.env.INPUT_PATHS || '';
    const inputPrefix = process.env.INPUT_PREFIX;
    const inputSuffix = process.env.INPUT_SUFFIX;
    const overwrite = process.env.INPUT_OVERWRITE === 'true';

    const ignoreStyles = process.env['INPUT_IGNORE-STYLES'] === 'true';
    const ignoreScripts = process.env['INPUT_IGNORE-SCRIPTS'] === 'true';
    const ignoreImages = process.env['INPUT_IGNORE-IMAGES'] === 'true';
    const ignoreLinks = process.env['INPUT_IGNORE-LINKS'] === 'true';

    // If neither prefix nor suffix is specified, use default prefix
    let prefix = '';
    let suffix = '';

    if (inputPrefix !== undefined) {
      prefix = inputPrefix;
    }

    if (inputSuffix !== undefined) {
      suffix = inputSuffix;
    }

    // Apply default prefix only if both are unspecified
    if (inputPrefix === undefined && inputSuffix === undefined) {
      prefix = 'inlined-';
    }

    if (!paths) {
      throw new Error('Input paths are required');
    }

    // Parse input paths (supports YAML arrays and comma-separated strings)
    const inputPaths = parseInputPaths(paths);
    if (inputPaths.length === 0) {
      throw new Error('No valid paths provided');
    }

    // Expand directories to HTML files
    const expandedPaths = await expandPaths(inputPaths);
    if (expandedPaths.length === 0) {
      console.warn('No HTML files found in the specified paths');
      return;
    }

    console.log(`Found ${expandedPaths.length} HTML file(s) to process`);

    for (const filePath of expandedPaths) {
      try {
        await fs.access(filePath);
      } catch {
        console.error(`File not accessible: ${filePath}`);
        continue;
      }

      const inlinedHtml = await inlineHtml(filePath, {
        ignoreStyles,
        ignoreScripts,
        ignoreImages,
        ignoreLinks
      });

      let outputPath: string;

      if (overwrite) {
        outputPath = filePath;
      } else {
        const dir = dirname(filePath);
        const name = basename(filePath, extname(filePath));
        const ext = extname(filePath);

        // Handle flexible prefix/suffix combinations
        let outputFileName: string;
        if (prefix && suffix) {
          outputFileName = `${prefix}${name}${suffix}${ext}`;
        } else if (prefix && !suffix) {
          outputFileName = `${prefix}${name}${ext}`;
        } else if (!prefix && suffix) {
          // If suffix contains dot, treat it as part of extension
          if (suffix.startsWith('.')) {
            outputFileName = `${name}${suffix}${ext}`;
          } else {
            outputFileName = `${name}${suffix}${ext}`;
          }
        } else {
          // Both prefix and suffix are empty, use default suffix
          outputFileName = `${name}-inlined${ext}`;
        }

        outputPath = resolve(dir, outputFileName);
      }

      await fs.writeFile(outputPath, inlinedHtml, 'utf-8');

      if (overwrite) {
        console.log(`Overwritten: ${filePath}`);
      } else {
        console.log(`Processed: ${filePath} -> ${outputPath}`);
      }
    }
  } catch (error) {
    console.error('Error processing files:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}