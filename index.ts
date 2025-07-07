import type MarkdownIt from "markdown-it";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { CHTML } from "mathjax-full/js/output/chtml.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { AssistiveMmlHandler } from "mathjax-full/js/a11y/assistive-mml.js"

type StateInline = MarkdownIt.StateInline
type StateBlock = MarkdownIt.StateBlock
type StateCore = MarkdownIt.StateCore;
type Token = MarkdownIt.Token;

let inlineMathSeparator = [['$', '$']];
let displayMathSeparator = [['$$', '$$']];

function isValidDelim(state:StateInline, pos: number, delimiter = '$') {
    let max = state.posMax, can_open = true, can_close = true;
    const prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
    const nextChar = pos + delimiter.length <= max ? state.src.charCodeAt(pos + delimiter.length) : -1;


    // Check non-whitespace conditions for opening and closing, and
    // check that closing delimiter isn't followed by a number
    if (prevChar === 0x20 /* " " */ ||
        prevChar === 0x09 /* \t */ ||
        (nextChar >= 0x30 /* "0" */ && nextChar <= 0x39) /* "9" */) {
        can_close = false;
    }
    if (nextChar === 0x20 /* " " */ || nextChar === 0x09 /* \t */) {
        can_open = false;
    }

    return {
        can_open: can_open,
        can_close: can_close,
    };
}

function math_inline(state:StateInline, silent:boolean) {
    // 添加详细的调试信息
    // 检查当前位置是否匹配任何一个起始符号
    let matchedDelimiter = null;
    for (const [openDelim, closeDelim] of inlineMathSeparator) {

        if (state.src.slice(state.pos, state.pos + openDelim.length) === openDelim) {
            matchedDelimiter = [openDelim, closeDelim];
            break;
        }
    }

    if (!matchedDelimiter) {
        return false;
    }

    const [openDelim, closeDelim] = matchedDelimiter;

    let res = isValidDelim(state, state.pos, openDelim);

    if (!res.can_open) {
        if (!silent) {
            state.pending += openDelim;
        }
        state.pos += openDelim.length;
        return true;
    }

    // First check for and bypass all properly escaped delimiters
    // This loop will assume that the first leading backtick can not
    // be the first character in state.src, which is known since
    // we have found an opening delimiter already.
    const start = state.pos + openDelim.length;
    let match = start;
    while ((match = state.src.indexOf(closeDelim, match)) !== -1) {
        // Found potential closing delimiter, look for escapes, pos will point to
        // first non escape when complete
        let pos = match - 1;
        while (state.src[pos] === "\\") {
            pos -= 1;
        }
        // Even number of escapes, potential closing delimiter found
        if ((match - pos) % 2 == 1) {
            break;
        }
        match += 1;
    }

    // No closing delimiter found.  Consume opening delimiter and continue.
    if (match === -1) {
        if (!silent) {
            state.pending += openDelim;
        }
        state.pos = start;
        return true;
    }

    // Check if we have empty content, ie: openDelim + closeDelim.  Do not parse.
    if (match - start === 0) {
        if (!silent) {
            state.pending += openDelim + closeDelim;
        }
        state.pos = start + closeDelim.length;
        return true;
    }

    // Check for valid closing delimiter
    res = isValidDelim(state, match, closeDelim);
    if (!res.can_close) {
        if (!silent) {
            state.pending += openDelim;
        }
        state.pos = start;
        return true;
    }

    if (!silent) {
        const token = state.push("math_inline", "math", 0);
        token.markup = openDelim;
        token.content = state.src.slice(start, match);
    }

    state.pos = match + closeDelim.length;
    return true;
}

function math_block(state:StateBlock, start:number, end:number, silent:boolean) {
    let next: number, lastPos: number;
    let found = false, pos = state.bMarks[start] + state.tShift[start], max = state.eMarks[start], lastLine = "";

    // 检查当前位置是否匹配任何一个起始符号
    let matchedDelimiter = null;
    for (const [openDelim, closeDelim] of displayMathSeparator) {
        if (state.src.slice(pos, pos + openDelim.length) === openDelim) {
            matchedDelimiter = [openDelim, closeDelim];
            break;
        }
    }

    if (!matchedDelimiter) {
        return false;
    }

    const [openDelim, closeDelim] = matchedDelimiter;

    // 检查是否有足够的字符
    if (pos + openDelim.length > max) {
        return false;
    }

    pos += openDelim.length;
    let firstLine = state.src.slice(pos, max);

    if (silent) {
        return true;
    }

    // 检查单行表达式
    if (firstLine.trim().slice(-closeDelim.length) === closeDelim) {
        // Single line expression
        firstLine = firstLine.trim().slice(0, -closeDelim.length);
        found = true;
    }

    // 多行表达式处理
    for (next = start; !found;) {
        next++;
        if (next >= end) {
            break;
        }
        pos = state.bMarks[next] + state.tShift[next];
        max = state.eMarks[next];
        if (pos < max && state.tShift[next] < state.blkIndent) {
            // non-empty line with negative indent should stop the list:
            break;
        }
        if (state.src.slice(pos, max).trim().slice(-closeDelim.length) === closeDelim) {
            lastPos = state.src.slice(0, max).lastIndexOf(closeDelim);
            lastLine = state.src.slice(pos, lastPos);
            found = true;
        }
    }

    state.line = next + 1;
    const token = state.push("math_block", "math", 0);
    token.block = true;
    token.content =
        (firstLine && firstLine.trim() ? firstLine + "\n" : "") +
        state.getLines(start + 1, next, state.tShift[start], true) +
        (lastLine && lastLine.trim() ? lastLine : "");
    token.map = [start, state.line];
    token.markup = openDelim;
    return true;
}

function processMath(state: StateCore, documentOptions: any) {
    const mathTokens: Token[] = [];

    // Recursively find all math tokens
    function walk(tokens: Token[]) {
        if (!tokens) return;
        for (const token of tokens) {
            if (token.type === 'math_inline' || token.type === 'math_block') {
                mathTokens.push(token);
            }
            if (token.children) {
                walk(token.children);
            }
        }
    }

    walk(state.tokens);

    if (mathTokens.length === 0) {
        return;
    }

    const formulas = mathTokens.map(token => token.content);
    const displayModes = mathTokens.map(token => token.type === 'math_block');

    const adaptor = liteAdaptor();
    const handler = RegisterHTMLHandler(adaptor);
    AssistiveMmlHandler(handler);

    const combinedContent = formulas.map((content, i) => {
        if (displayModes[i]) {
            // 对于块级公式，使用第一个displayMathSeparator
            const [openDelim, closeDelim] = displayMathSeparator[0];
            return `${openDelim}${content}${closeDelim}`;
        } else {
            // 对于行内公式，使用第一个inlineMathSeparator
            const [openDelim, closeDelim] = inlineMathSeparator[0];
            return `${openDelim}${content}${closeDelim}`;
        }
    }).join('');


    const mathDocument = mathjax.document(combinedContent, documentOptions);

    // This call is needed to produce the stylesheet
    mathDocument.render();
    const stylesheet = adaptor.outerHTML(documentOptions.OutputJax.styleSheet(mathDocument));
    state.env.mathjax_stylesheet = extractCssFromStyleTag(stylesheet);

    const body = adaptor.body(mathDocument.document);
    const renderedHtmls = adaptor.childNodes(body).map(node => adaptor.outerHTML(node as any));

    // Replace math tokens with rendered HTML by modifying them in-place
    mathTokens.forEach((token, i) => {
        token.type = displayModes[i] ? 'html_block' : 'html_inline';
        token.content = renderedHtmls[i];
        // token.tag = '';
        // token.markup = '';
    });
}

function extractCssFromStyleTag(str: string) {
    const match = str.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    return match ? match[1] : str;
}

function plugin(md:MarkdownIt, options:any) {

    if (options?.user_side) {
        md.core.ruler.push('inject_content', (state) => {
            if (!state.env.frontmatter) state.env.frontmatter = {};
            let mathjax_options = options?.mathjax_options || {};

            state.env.frontmatter.inject_content = [
                {
                    type: 'script',
                    contribution: { type: 'text/javascript' },
                    content: `window.MathJax = {
                            startup: { ready: () => {
                                MathJax.startup.defaultReady();
                                console.log('MathJax loaded');
                            }
                                },
                            options: ${JSON.stringify(
                                Object.assign({
                                    enableMenu: true,
                                }, mathjax_options))}
                            };`
                },
                {
                    type: 'script',
                    contribution: {
                        async: true,
                        src: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
                        id: 'MathJax-script'
                    },
                }]
            return true;
        });
    }
    else {
        // Default options
        const documentOptions = {
            InputJax: new TeX(
                Object.assign(
                    {
                        packages: AllPackages,
                        inlineMath: inlineMathSeparator,
                        displayMath: displayMathSeparator
                    },
                    options?.tex
                )),
            OutputJax: options?.svg
                ? new SVG(  // 使用 SVG 处理器
                    Object.assign(
                        {
                            fontCache: 'local',  // SVG 默认配置
                            displayAlign: 'center'
                        },
                        options.svg  // 合并用户自定义 SVG 配置
                    )
                )
                : new CHTML(  // 默认使用 CHTML 处理器
                    Object.assign(
                        {
                            fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
                        },
                        options?.chtml  // 合并用户自定义 CHTML 配置
                    )
                )
        };

        // set user options for inlineMathSeparator and displayMathSeparator
        inlineMathSeparator = options?.tex.inlineMath || inlineMathSeparator;
        displayMathSeparator = options?.tex.displayMath || displayMathSeparator;
        // set rulers for inline or block
        md.inline.ruler.before("text", "math_inline", math_inline);
        md.block.ruler.after("blockquote", "math_block", math_block, {
            alt: ["paragraph", "reference", "blockquote", "list"],
        });

        md.core.ruler.push('mathjax_render', (state) => {
            // Initialize env for each render
            state.env.mathjax_stylesheet = null;
            processMath(state, documentOptions);
            return true;
        });

        // Patch core ruler to inject stylesheet into frontmatter
        md.core.ruler.push('inject_content', (state) => {
            if (state.env && state.env.mathjax_stylesheet) {
                // 确保 frontmatter 存在
                if (!state.env.frontmatter) state.env.frontmatter = {};
                state.env.frontmatter.inject_content = [
                    {
                        type: 'style',
                        contribution: { type: 'text/css' },
                        content: state.env.mathjax_stylesheet
                    }
                ]
            }
            return true;
        });

    }
}
plugin.default = plugin;
plugin.displayName = 'MarkdownItMathJaX3PRO';  // 添加显示名称
export = plugin;
