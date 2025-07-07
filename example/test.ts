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
    user_side:{}
});

// 创建共享的 env 对象
const env: any = {};

// 使用同一个 env 对象进行渲染
const result = mdInstance.render(md, env);

// 现在可以从 env 中获取样式表
const stylesheet = env.mathjax_stylesheet || '';

// 创建完整的 HTML 文档
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Direction Cosines - MathJax Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        /* MathJax 生成的样式表 - 用于正确隐藏辅助元素 */
        ${stylesheet}
    </style>
</head>
<body>
    ${result}
</body>
</html>`;

// 写入文件
const outputPath = join(__dirname, 'test.html');
writeFileSync(outputPath, htmlContent, 'utf8');

console.log('HTML file generated successfully: test.html');
console.log(result);
