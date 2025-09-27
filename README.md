# HTML Inline Actions

A GitHub Action that inlines CSS, JavaScript, and images into HTML files.

## Features

- Inline CSS files (`<link rel="stylesheet">`) into `<style>` tags
- Inline JavaScript files (`<script src="">`) into script blocks
- Base64 inlining of images (`<img src=""`) as data URIs
- Batch processing of multiple files

## Usage

```yaml
- uses: ntsk/html-inline-actions@v1
  with:
    paths:
      - 'src/index.html'
      - 'src/about.html'
    prefix: 'inlined-'
```

## Input Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `paths` | ✓ | - | HTML file paths or directories (YAML array or single path. Directories are recursively searched for .html files) |
| `prefix` | - | `''` | Prefix for output filenames |
| `suffix` | - | `''` | Suffix for output filenames |
| `overwrite` | - | `'false'` | Overwrite original files (true/false) |

## Example

Input file `index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="style.css">
  <script src="script.js"></script>
</head>
<body>
  <img src="image.png" alt="Test">
</body>
</html>
```

Output file `inlined-index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <style>body { color: red; }</style>
  <script>console.log("Hello");</script>
</head>
<body>
  <img src="data:image/png;base64,iVBORw0KGgo..." alt="Test">
</body>
</html>
```
