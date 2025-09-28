import { createReadStream, promises } from 'fs';
import { resolve, extname, isAbsolute, relative, dirname, basename, join } from 'path';
import { pipeline, Transform } from 'stream';
import { promisify } from 'util';

promisify(pipeline);
/**
 * A streaming Transform class that converts binary data to Base64 encoding in chunks.
 *
 * This implementation provides memory-efficient Base64 encoding for large files by processing
 * data in small chunks rather than loading entire files into memory. The class handles the
 * 3-byte boundary requirement of Base64 encoding by buffering incomplete chunks and carrying
 * them over to the next transformation cycle.
 */
class Base64Transform extends Transform {
    remainder = Buffer.alloc(0);
    _transform(chunk, encoding, callback) {
        // Concatenate previous remainder with new chunk
        const data = Buffer.concat([this.remainder, chunk]);
        // Base64 requires 3-byte chunks, so calculate processable length (multiple of 3)
        const processLength = Math.floor(data.length / 3) * 3;
        if (processLength > 0) {
            // Process the 3-byte aligned portion
            const processData = data.slice(0, processLength);
            this.push(processData.toString('base64'));
            // Save remainder for next chunk
            this.remainder = data.slice(processLength);
        }
        else {
            // If less than 3 bytes, save all as remainder
            this.remainder = data;
        }
        callback();
    }
    _flush(callback) {
        // Process any remaining bytes at the end (with padding)
        if (this.remainder.length > 0) {
            this.push(this.remainder.toString('base64'));
        }
        callback();
    }
}
async function streamToBase64(filePath) {
    return new Promise((resolve, reject) => {
        let base64Data = '';
        const base64Transform = new Base64Transform();
        base64Transform.on('data', (chunk) => {
            base64Data += chunk;
        });
        base64Transform.on('end', () => {
            resolve(base64Data);
        });
        base64Transform.on('error', reject);
        const readStream = createReadStream(filePath);
        readStream.pipe(base64Transform);
        readStream.on('error', reject);
    });
}
async function createDataUrl(filePath, mimeType) {
    try {
        const base64Data = await streamToBase64(filePath);
        return `data:${mimeType};base64,${base64Data}`;
    }
    catch (error) {
        throw new Error(`Failed to create data URL for ${filePath}: ${error}`);
    }
}

async function inlineHtml(filePath, options = {}) {
    const htmlContent = await promises.readFile(filePath, 'utf-8');
    const basedir = resolve(filePath, '..');
    let result = htmlContent;
    if (!options.ignoreStyles) {
        result = await inlineStyles(result, basedir);
    }
    if (!options.ignoreScripts) {
        result = await inlineScripts(result, basedir);
    }
    if (!options.ignoreImages) {
        result = await inlineImages(result, basedir);
    }
    if (!options.ignoreLinks) {
        result = await inlineLinks(result, basedir);
    }
    return result;
}
async function inlineStyles(html, basedir) {
    const linkRegex = /<link\s+([^>]*rel=["']stylesheet["'][^>]*)>/gi;
    let result = html;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const linkTag = match[0];
        const attributes = match[1];
        const hrefMatch = attributes.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
            const href = hrefMatch[1];
            const cssPath = fixPath(href, basedir);
            try {
                const cssContent = await promises.readFile(cssPath, 'utf-8');
                const styleTag = `<style>${cssContent}</style>`;
                result = result.replace(linkTag, styleTag);
            }
            catch (error) {
                console.warn(`Could not inline stylesheet: ${cssPath}`);
            }
        }
    }
    return result;
}
async function inlineScripts(html, basedir) {
    const scriptRegex = /<script\s+([^>]*src=["'][^"']+["'][^>]*)><\/script>/gi;
    let result = html;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const scriptTag = match[0];
        const attributes = match[1];
        const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
            const src = srcMatch[1];
            const jsPath = fixPath(src, basedir);
            try {
                const jsContent = await promises.readFile(jsPath, 'utf-8');
                const inlineScript = `<script>${jsContent}</script>`;
                result = result.replace(scriptTag, inlineScript);
            }
            catch (error) {
                console.warn(`Could not inline script: ${jsPath}`);
            }
        }
    }
    return result;
}
async function inlineImages(html, basedir) {
    const imgRegex = /<img\s+([^>]*src=["'][^"']+["'][^>]*)>/gi;
    let result = html;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
        const imgTag = match[0];
        const attributes = match[1];
        const srcMatch = attributes.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
            const src = srcMatch[1];
            if (src.startsWith('data:')) {
                continue;
            }
            const imgPath = fixPath(src, basedir);
            try {
                const ext = extname(imgPath).replace(/^\./, '').toLowerCase();
                const mimeType = getMimeType(ext);
                const dataUrl = await createDataUrl(imgPath, mimeType);
                const newImgTag = imgTag.replace(/src=["'][^"']+["']/i, `src="${dataUrl}"`);
                result = result.replace(imgTag, newImgTag);
            }
            catch (error) {
                console.warn(`Could not inline image: ${imgPath}`, error);
            }
        }
    }
    return result;
}
async function inlineLinks(html, basedir) {
    const linkRegex = /<link\s+([^>]*href=["'][^"']+["'][^>]*)>/gi;
    let result = html;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const linkTag = match[0];
        const attributes = match[1];
        const relMatch = attributes.match(/rel=["']([^"']+)["']/i);
        if (relMatch && relMatch[1].toLowerCase() === 'stylesheet') {
            continue;
        }
        const hrefMatch = attributes.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
            const href = hrefMatch[1];
            if (href.startsWith('data:')) {
                continue;
            }
            const linkPath = fixPath(href, basedir);
            try {
                const linkBuffer = await promises.readFile(linkPath);
                const ext = extname(linkPath).replace(/^\./, '').toLowerCase();
                const mimeType = getMimeType(ext);
                const base64 = linkBuffer.toString('base64');
                const dataUrl = `data:${mimeType};base64,${base64}`;
                const newLinkTag = linkTag.replace(/href=["'][^"']+["']/i, `href="${dataUrl}"`);
                result = result.replace(linkTag, newLinkTag);
            }
            catch (error) {
                console.warn(`Could not inline link: ${linkPath}`);
            }
        }
    }
    return result;
}
function fixPath(p, basedir) {
    if (isAbsolute(p)) {
        return resolve(basedir, relative('/', p));
    }
    else {
        return resolve(basedir, p);
    }
}
function getMimeType(ext) {
    const mimeTypes = {
        svg: 'image/svg+xml',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        ico: 'image/x-icon',
        woff: 'font/woff',
        woff2: 'font/woff2',
        ttf: 'font/ttf',
        otf: 'font/otf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Parse input paths from GitHub Actions environment variable.
 * Supports both YAML array format and comma-separated string format.
 */
function parseInputPaths(pathsInput) {
    if (!pathsInput)
        return [];
    try {
        // Try parsing as JSON array (GitHub Actions converts YAML arrays to JSON)
        const parsed = JSON.parse(pathsInput);
        return Array.isArray(parsed) ? parsed : [parsed];
    }
    catch {
        // Fallback to comma-separated string (legacy support)
        return pathsInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
    }
}
/**
 * Find all HTML files in a directory recursively.
 */
async function findHtmlFiles(dirPath) {
    const htmlFiles = [];
    try {
        const entries = await promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            if (entry.isDirectory()) {
                // Recursively search subdirectories
                const subFiles = await findHtmlFiles(fullPath);
                htmlFiles.push(...subFiles);
            }
            else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    }
    catch (error) {
        console.warn(`Could not read directory: ${dirPath}`, error);
    }
    return htmlFiles;
}
/**
 * Expand paths to include HTML files from directories.
 */
async function expandPaths(inputPaths) {
    const expandedPaths = [];
    for (const inputPath of inputPaths) {
        const resolvedPath = resolve(inputPath);
        try {
            const stat = await promises.stat(resolvedPath);
            if (stat.isDirectory()) {
                // If directory, find all HTML files
                const htmlFiles = await findHtmlFiles(resolvedPath);
                expandedPaths.push(...htmlFiles);
            }
            else if (stat.isFile()) {
                // If file, add as-is
                expandedPaths.push(resolvedPath);
            }
        }
        catch (error) {
            console.warn(`Path not found: ${inputPath}`);
        }
    }
    return expandedPaths;
}
async function main() {
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
                await promises.access(filePath);
            }
            catch {
                console.error(`File not accessible: ${filePath}`);
                continue;
            }
            const inlinedHtml = await inlineHtml(filePath, {
                ignoreStyles,
                ignoreScripts,
                ignoreImages,
                ignoreLinks
            });
            let outputPath;
            if (overwrite) {
                outputPath = filePath;
            }
            else {
                const dir = dirname(filePath);
                const name = basename(filePath, extname(filePath));
                const ext = extname(filePath);
                // Handle flexible prefix/suffix combinations
                let outputFileName;
                if (prefix && suffix) {
                    outputFileName = `${prefix}${name}${suffix}${ext}`;
                }
                else if (prefix && !suffix) {
                    outputFileName = `${prefix}${name}${ext}`;
                }
                else if (!prefix && suffix) {
                    // If suffix contains dot, treat it as part of extension
                    if (suffix.startsWith('.')) {
                        outputFileName = `${name}${suffix}${ext}`;
                    }
                    else {
                        outputFileName = `${name}${suffix}${ext}`;
                    }
                }
                else {
                    // Both prefix and suffix are empty, use default suffix
                    outputFileName = `${name}-inlined${ext}`;
                }
                outputPath = resolve(dir, outputFileName);
            }
            await promises.writeFile(outputPath, inlinedHtml, 'utf-8');
            if (overwrite) {
                console.log(`Overwritten: ${filePath}`);
            }
            else {
                console.log(`Processed: ${filePath} -> ${outputPath}`);
            }
        }
    }
    catch (error) {
        console.error('Error processing files:', error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };
//# sourceMappingURL=index.js.map
