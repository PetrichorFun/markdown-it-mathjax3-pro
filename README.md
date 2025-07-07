# markdown-it-mathjax3-pro

A powerful markdown-it plugin for MathJax 3 with enhanced features supporting both Server-Side Rendering (SSR) and Client-Side Rendering (CSR) modes.
- [中文文档](./README.zh.md)

## Features

- 🚀 **Dual Rendering Modes**: Support both SSR and CSR
- 🎯 **Enhanced Performance**: Optimized batch processing for multiple math expressions
- 🎨 **Flexible Output**: Support both SVG and CHTML output formats
- 📝 **Custom Delimiters**: Configurable math delimiters
- 🔧 **TypeScript Support**: Full TypeScript support with type definitions
- 📦 **Zero Configuration**: Works out of the box with sensible defaults

## Quick Start

### Installation

```bash
npm install markdown-it-mathjax3-pro
```

### Basic Usage

```javascript
import MarkdownIt from 'markdown-it';
import MarkdownItMathJaX3PRO from 'markdown-it-mathjax3-pro';

const md = MarkdownIt().use(MarkdownItMathJaX3PRO);

const markdown = `
Inline math: $E = mc^2$

Block math:
$$
\\frac{d}{dx}\\int_{a}^{x} f(t)dt = f(x)
$$
`;

const result = md.render(markdown);
console.log(result);
```

## Configuration

The plugin accepts various configuration options:

### Server-Side Rendering (Default)

```javascript
const md = MarkdownIt().use(MarkdownItMathJaX3PRO, {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    tags: 'ams',
    packages: ['base', 'ams', 'newcommand', 'configmacros']
  },
  chtml: {
    fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
  },
  // Use SVG output instead of CHTML
  svg: {
    fontCache: 'local',
    displayAlign: 'center'
  }
});
```

### Client-Side Rendering

```javascript
const md = MarkdownIt().use(MarkdownItMathJaX3PRO, {
  user_side: true,
  mathjax_options: {
    enableMenu: true,
    // Other MathJax options
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `user_side` | boolean | false | Enable client-side rendering mode |
| `tex` | object | {...} | TeX input processor options |
| `tex.inlineMath` | array | [['$', '$']] | Inline math delimiters |
| `tex.displayMath` | array | [['$$', '$$']] | Block math delimiters |
| `chtml` | object | {...} | CHTML output options |
| `svg` | object | undefined | SVG output options (uses SVG instead of CHTML when provided) |
| `mathjax_options` | object | {} | Client-side MathJax configuration |

## Technical Implementation & Differences from markdown-it-mathjax3

### Key Differences from markdown-it-mathjax3

1. **Dual Mode Support**
    - **SSR Mode**: Uses MathJax-full to pre-render math expressions on the server
    - **CSR Mode**: Injects MathJax scripts for client-side rendering

2. **Batch Processing Mechanism**
    - Processes all math expressions in a single MathJax document
    - Significantly improves performance for documents with multiple formulas

3. **Enhanced Flexibility**
    - Support for both SVG and CHTML output formats
    - Configurable math delimiters
    - Better error handling and validation

4. **Stylesheet Management**
    - Automatic CSS style extraction and injection
    - Support for frontmatter injection for framework integration

### Architecture Design

```
Input Markdown
     ↓
Parse math tokens (inline and block)
     ↓
Batch process with MathJax
     ↓
Replace tokens with rendered HTML
     ↓
Inject stylesheets
     ↓
Output HTML
```

## Examples

### Complete Custom Configuration Example

See test.ts for details

### Client-Side Rendering Example

See test4csr.ts for details

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you have any questions or issues, please create an issue on GitHub.
