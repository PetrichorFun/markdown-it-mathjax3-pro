import MarkdownIt from 'markdown-it'
import MarkdownItMathJaX3PRO from '../index.js'
import { writeFileSync } from 'fs'
import { join } from 'path'

const md = `
Direction cosines are a very common concept in vectors, used to specify the direction of a vector. This might sound confusing at first, but don't worry, we'll use diagrams to understand it.

For example, as shown in the figure below, there is a coordinate system xoy, which looks like this:

It contains a vector $\\overrightarrow{l}$, with coordinates: $(a,b)$

The vector mentioned above satisfies the following equation:

$$
(\\frac{a}{\\sqrt{a^2+b^2}},\\frac{b}{\\sqrt{a^2+b^2}})
$$

The equation above is actually normalizing the vector. The newly generated vector is what we commonly call a **direction vector**.

The direction vector can actually be further optimized. We can see that there are two marked angles in the figure, namely $\\alpha$ and $\\beta$. I won't elaborate on their relationship, but they are a pair of complementary angles that satisfy the condition of adding up to 90 degrees.

At this point, we can transform this equation into the following form:

$$
\\frac{a}{\\sqrt{a^2+b^2}} = \\cos{\\alpha}
$$
`

// 初始化 markdown-it 并使用插件
const mdInstance = MarkdownIt().use(MarkdownItMathJaX3PRO, {
    tex: {tags: 'ams'},
    user_side: true,
});

// 渲染 markdown 内容
const env: any = {};
const renderedContent = mdInstance.render(md, env);

// 获取注入的内容
const injectContent = env.frontmatter?.inject_content || [];

// 生成注入的脚本（简化版本，适用于固定的 MathJax 脚本）
let injectHead = '';
if (injectContent.length > 0) {
    // 由于 user_side 模式下注入的内容是固定的 MathJax 配置和 CDN 脚本
    // 我们可以直接提取配置并生成标准的 MathJax 加载代码
    const configScript = injectContent.find((item: any) => item.type === 'script' && item.content);
    const cdnScript = injectContent.find((item: any) => item.type === 'script' && item.contribution?.src);

    if (configScript) {
        injectHead += `    <script type="text/javascript">\n${configScript.content}\n    </script>\n`;
    }

    if (cdnScript) {
        injectHead += `    <script async src="${cdnScript.contribution.src}" id="${cdnScript.contribution.id}"></script>\n`;
    }
}

// 创建完整的 HTML 文档
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Direction Cosines - MathJax Test</title>
${injectHead}
</head>
<body>
    ${renderedContent}
</body>
</html>`;

// 写入文件

const outputPath = join(__dirname, 'test4csr.html');
writeFileSync(outputPath, htmlContent, 'utf8');

console.log('HTML file generated successfully: test.html');
console.log('Injected content:', injectContent);
