import { promises as fs } from 'fs';
import { resolve, relative, isAbsolute, extname } from 'path';
import { createDataUrl } from './streaming-base64.js';

interface InlineOptions {
  ignoreScripts?: boolean;
  ignoreImages?: boolean;
  ignoreLinks?: boolean;
  ignoreStyles?: boolean;
}

export async function inlineHtml(filePath: string, options: InlineOptions = {}): Promise<string> {
  const htmlContent = await fs.readFile(filePath, 'utf-8');
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

async function inlineStyles(html: string, basedir: string): Promise<string> {
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
        const cssContent = await fs.readFile(cssPath, 'utf-8');
        const styleTag = `<style>${cssContent}</style>`;
        result = result.replace(linkTag, styleTag);
      } catch (error) {
        console.warn(`Could not inline stylesheet: ${cssPath}`);
      }
    }
  }

  return result;
}

async function inlineScripts(html: string, basedir: string): Promise<string> {
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
        const jsContent = await fs.readFile(jsPath, 'utf-8');
        const inlineScript = `<script>${jsContent}</script>`;
        result = result.replace(scriptTag, inlineScript);
      } catch (error) {
        console.warn(`Could not inline script: ${jsPath}`);
      }
    }
  }

  return result;
}

async function inlineImages(html: string, basedir: string): Promise<string> {
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
      } catch (error) {
        console.warn(`Could not inline image: ${imgPath}`, error);
      }
    }
  }

  return result;
}

async function inlineLinks(html: string, basedir: string): Promise<string> {
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
        const linkBuffer = await fs.readFile(linkPath);
        const ext = extname(linkPath).replace(/^\./, '').toLowerCase();
        const mimeType = getMimeType(ext);
        const base64 = linkBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;

        const newLinkTag = linkTag.replace(/href=["'][^"']+["']/i, `href="${dataUrl}"`);
        result = result.replace(linkTag, newLinkTag);
      } catch (error) {
        console.warn(`Could not inline link: ${linkPath}`);
      }
    }
  }

  return result;
}

function fixPath(p: string, basedir: string): string {
  if (isAbsolute(p)) {
    return resolve(basedir, relative('/', p));
  } else {
    return resolve(basedir, p);
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: { [key: string]: string } = {
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
