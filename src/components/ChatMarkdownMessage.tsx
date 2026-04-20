import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import SyntaxHighlighter from 'react-native-syntax-highlighter';
import atomDark from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark';
import MathView from './MathView';

interface ChatMarkdownMessageProps {
    content: string;
    isUser: boolean;
    fillWidth?: boolean;
}

interface ParsedSegment {
    type: 'markdown' | 'code';
    key: string;
    text: string;
    language?: string;
}

// Matches code fences only. Markdown parser handles inline/block math.
const SEGMENT_REGEX = /```([^\n`]*)\n([\s\S]*?)```/g;

const CODE_THEME = atomDark as any;
const MATH_BLOCK_VERTICAL_MARGIN = 2;
const MATH_BLOCK_VERTICAL_PADDING = 2;
const INLINE_MATH_VERTICAL_MARGIN = 0;
const SYNTAX_STYLE = {
    margin: 0,
    padding: 0,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
    minWidth: '100%',
};

const findClosingInlineMarker = (source: string, startIndex: number, marker: string): number => {
    for (let index = startIndex; index < source.length; index += 1) {
        if (source.startsWith(marker, index) && source[index - 1] !== '\\') {
            return index;
        }
    }

    return -1;
};

const mathMarkdownPlugin = (markdownIt: any) => {
    const inlineRule = (state: any, silent: boolean) => {
        const { src, pos } = state;

        if (src.startsWith('\\(', pos)) {
            const end = findClosingInlineMarker(src, pos + 2, '\\)');
            if (end === -1) {
                return false;
            }

            const content = src.slice(pos + 2, end).trim();
            if (!content) {
                return false;
            }

            if (!silent) {
                const token = state.push('math_inline', 'math', 0);
                token.content = content;
                token.markup = '\\(';
            }

            state.pos = end + 2;
            return true;
        }

        if (src[pos] !== '$' || src[pos + 1] === '$') {
            return false;
        }

        const end = findClosingInlineMarker(src, pos + 1, '$');
        if (end === -1) {
            return false;
        }

        const content = src.slice(pos + 1, end).trim();
        if (!content) {
            return false;
        }

        if (!silent) {
            const token = state.push('math_inline', 'math', 0);
            token.content = content;
            token.markup = '$';
        }

        state.pos = end + 1;
        return true;
    };

    const blockRule = (state: any, startLine: number, endLine: number, silent: boolean) => {
        const start = state.bMarks[startLine] + state.tShift[startLine];
        const max = state.eMarks[startLine];
        const firstLine = state.src.slice(start, max).trim();

        let openMarker = '';
        let closeMarker = '';
        if (firstLine.startsWith('$$')) {
            openMarker = '$$';
            closeMarker = '$$';
        } else if (firstLine.startsWith('\\[')) {
            openMarker = '\\[';
            closeMarker = '\\]';
        } else {
            return false;
        }

        if (silent) {
            return true;
        }

        let nextLine = startLine;
        let found = false;
        const lines: string[] = [];
        let lineRemainder = firstLine.slice(openMarker.length);

        if (lineRemainder.endsWith(closeMarker)) {
            lines.push(lineRemainder.slice(0, -closeMarker.length));
            found = true;
        } else {
            if (lineRemainder) {
                lines.push(lineRemainder);
            }

            for (nextLine = startLine + 1; nextLine < endLine; nextLine += 1) {
                const lineStart = state.bMarks[nextLine] + state.tShift[nextLine];
                const lineMax = state.eMarks[nextLine];
                const line = state.src.slice(lineStart, lineMax);
                const trimmedLine = line.trim();

                if (trimmedLine.endsWith(closeMarker)) {
                    lines.push(trimmedLine.slice(0, -closeMarker.length));
                    found = true;
                    break;
                }

                lines.push(line);
            }
        }

        if (!found) {
            return false;
        }

        state.line = nextLine + 1;
        const token = state.push('math_block', 'math', 0);
        token.block = true;
        token.content = lines.join('\n').trim();
        token.map = [startLine, state.line];
        token.markup = openMarker;
        return true;
    };

    markdownIt.inline.ruler.before('escape', 'math_inline', inlineRule);
    markdownIt.block.ruler.before('fence', 'math_block', blockRule, {
        alt: ['paragraph', 'reference', 'blockquote', 'list'],
    });
};

const isMarkdownStructuralLine = (trimmedLine: string): boolean => {
    return (
        /^#{1,6}\s/.test(trimmedLine) ||
        /^[-*+]\s/.test(trimmedLine) ||
        /^\d+\.\s/.test(trimmedLine) ||
        /^>\s?/.test(trimmedLine) ||
        /^```/.test(trimmedLine) ||
        /^\|/.test(trimmedLine) ||
        /^([-*_]){3,}$/.test(trimmedLine) ||
        /^\$\$/.test(trimmedLine) ||
        /^\\\[/.test(trimmedLine) ||
        /^\\\]/.test(trimmedLine)
    );
};

const shouldPromoteInlineMath = (value: string): boolean => {
    const latex = normalizeMathBlockLatex(value);
    return latex.length > 34 || /\\(?:frac|sum|int|prod|begin|matrix)/.test(latex);
};

const promoteInlineMathInLine = (line: string): string => {
    const segments: string[] = [];
    let current = '';
    let index = 0;

    const pushCurrent = () => {
        if (!current.trim()) {
            current = '';
            return;
        }

        segments.push(segments.length === 0 ? current.trimEnd() : current.trim());
        current = '';
    };

    while (index < line.length) {
        let openMarker = '';
        let closeMarker = '';

        if (line.startsWith('\\(', index)) {
            openMarker = '\\(';
            closeMarker = '\\)';
        } else if (line[index] === '$' && line[index + 1] !== '$' && line[index - 1] !== '\\') {
            openMarker = '$';
            closeMarker = '$';
        }

        if (!openMarker) {
            current += line[index];
            index += 1;
            continue;
        }

        const end = findClosingInlineMarker(line, index + openMarker.length, closeMarker);
        if (end === -1) {
            current += line.slice(index);
            break;
        }

        const rawContent = line.slice(index + openMarker.length, end).trim();
        const rawFormula = line.slice(index, end + closeMarker.length);

        const before = line.slice(0, index).trim();
        const after = line.slice(end + closeMarker.length).trim();
        const isStandaloneFormulaLine = !before && !after;

        if (rawContent && (shouldPromoteInlineMath(rawContent) || isStandaloneFormulaLine)) {
            pushCurrent();
            segments.push('$$');
            segments.push(rawContent);
            segments.push('$$');
            index = end + closeMarker.length;
            if (line[index] === ' ') {
                index += 1;
            }
            continue;
        }

        current += rawFormula;
        index = end + closeMarker.length;
    }

    pushCurrent();

    return segments.length ? segments.join('\n') : line;
};

const promoteLongInlineMathBlocks = (value: string): string => {
    const lines = String(value || '').replace(/\r\n/g, '\n').split('\n');
    const nextLines: string[] = [];
    let inCodeFence = false;
    let inMathBlock = false;

    for (const rawLine of lines) {
        const trimmedLine = rawLine.trim();

        if (/^```/.test(trimmedLine)) {
            inCodeFence = !inCodeFence;
            nextLines.push(rawLine);
            continue;
        }

        if (inCodeFence) {
            nextLines.push(rawLine);
            continue;
        }

        if (trimmedLine === '$$' || trimmedLine === '\\[' || trimmedLine === '\\]') {
            inMathBlock = !inMathBlock;
            nextLines.push(rawLine);
            continue;
        }

        if (inMathBlock) {
            nextLines.push(rawLine);
            continue;
        }

        nextLines.push(promoteInlineMathInLine(rawLine));
    }

    return nextLines.join('\n');
};

const normalizeMarkdownLayout = (value: string): string => {
    const lines = String(value || '').replace(/\r\n/g, '\n').split('\n');
    const normalizedLines: string[] = [];
    let paragraphParts: string[] = [];
    let inCodeFence = false;
    let inMathBlock = false;

    const flushParagraph = () => {
        if (!paragraphParts.length) {
            return;
        }

        normalizedLines.push(paragraphParts.join(' ').replace(/[ \t]{2,}/g, ' ').trim());
        paragraphParts = [];
    };

    for (const rawLine of lines) {
        const trimmedLine = rawLine.trim();

        if (/^```/.test(trimmedLine)) {
            flushParagraph();
            inCodeFence = !inCodeFence;
            normalizedLines.push(rawLine);
            continue;
        }

        if (inCodeFence) {
            normalizedLines.push(rawLine);
            continue;
        }

        if (trimmedLine === '$$' || trimmedLine === '\\[' || trimmedLine === '\\]') {
            flushParagraph();
            inMathBlock = !inMathBlock;
            normalizedLines.push(rawLine);
            continue;
        }

        if (inMathBlock) {
            normalizedLines.push(rawLine);
            continue;
        }

        if (!trimmedLine) {
            flushParagraph();
            if (normalizedLines[normalizedLines.length - 1] !== '') {
                normalizedLines.push('');
            }
            continue;
        }

        if (isMarkdownStructuralLine(trimmedLine)) {
            flushParagraph();
            normalizedLines.push(rawLine);
            continue;
        }

        paragraphParts.push(trimmedLine);
    }

    flushParagraph();

    return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
};

const normalizeContent = (value: string): string => {
    const normalized = normalizeMarkdownLayout(promoteLongInlineMathBlocks(value))
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return normalized || ' ';
};

const normalizeInlineMathText = (value: string): string => {
    return String(value || '')
        .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
        .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
        .replace(/\\times/g, 'x')
        .replace(/\\cdot/g, '*')
        .replace(/\\leq?/g, '<=')
        .replace(/\\geq?/g, '>=')
        .replace(/\\neq/g, '!=')
        .replace(/\\approx/g, '~')
        .replace(/\\left/g, '')
        .replace(/\\right/g, '')
        .replace(/\\([a-zA-Z]+)/g, '$1')
        .replace(/[{}]/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
};

const normalizeMathBlockLatex = (value: string): string => {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .trim();
};

const normalizeMathBlockText = (value: string): string => {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/\\\\/g, '\n')
        .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, '')
        .replace(/\\(?:quad|qquad|,|;|!|:)/g, ' ')
        .split('\n')
        .map((line) => normalizeInlineMathText(line))
        .filter((line) => line.length > 0)
        .join('\n')
        .trim();
};

const getCodeTextFromNode = (node: any): string => {
    const direct = String(node?.content || node?.value || '').replace(/\r\n/g, '\n');
    if (direct.trim()) {
        return direct;
    }

    if (Array.isArray(node?.children)) {
        const fromChildren = node.children
            .map((child: any) => String(child?.content || child?.value || ''))
            .join('')
            .replace(/\r\n/g, '\n');

        if (fromChildren.trim()) {
            return fromChildren;
        }
    }

    return '';
};

const getCodeLanguageFromNode = (node: any): string => {
    const rawInfo = String(node?.info || '').trim();
    if (!rawInfo) {
        return 'text';
    }

    return rawInfo.split(/\s+/)[0] || 'text';
};

const normalizeCodeLanguage = (language?: string): string => {
    const key = String(language || 'text').trim().toLowerCase();
    const aliases: Record<string, string> = {
        js: 'javascript',
        jsx: 'jsx',
        ts: 'typescript',
        tsx: 'tsx',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        shell: 'bash',
        zsh: 'bash',
        yml: 'yaml',
        md: 'markdown',
        text: 'plaintext',
        plain: 'plaintext',
        console: 'bash',
        'c++': 'cpp',
        cpp: 'cpp',
        'c#': 'csharp',
        cs: 'csharp',
    };

    return aliases[key] || key || 'plaintext';
};

const parseMarkdownSegments = (value: string): ParsedSegment[] => {
    const segments: ParsedSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let counter = 0;
    SEGMENT_REGEX.lastIndex = 0;

    while ((match = SEGMENT_REGEX.exec(value)) !== null) {
        const before = value.slice(lastIndex, match.index);
        if (before.trim()) {
            segments.push({
                type: 'markdown',
                key: `md-${counter}-${lastIndex}`,
                text: before,
            });
        }

        if (match[1] !== undefined) {
            // Code block: ```lang\ncode```
            const language = String(match[1] || '').trim().split(/\s+/)[0] || 'text';
            const codeText = String(match[2] || '').replace(/\r\n/g, '\n').replace(/\n$/, '');
            segments.push({
                type: 'code',
                key: `code-${counter}-${match.index}`,
                text: codeText,
                language,
            });
        }

        lastIndex = match.index + match[0].length;
        counter += 1;
    }

    const tail = value.slice(lastIndex);
    if (tail.trim()) {
        segments.push({
            type: 'markdown',
            key: `md-tail-${lastIndex}`,
            text: tail,
        });
    }

    if (!segments.length) {
        return [{ type: 'markdown', key: 'md-only', text: value }];
    }

    return segments;
};

const markdownStylesFor = (isUser: boolean, fillWidth: boolean) => ({
    body: {
        color: isUser ? '#FFFFFF' : '#1F2937',
        fontSize: 15,
        lineHeight: 23,
        ...(fillWidth
            ? {
                width: '100%',
                flexShrink: 1,
            }
            : {
                alignSelf: 'flex-start',
            }),
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 8,
        color: isUser ? '#FFFFFF' : '#1F2937',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        ...(fillWidth
            ? {
                width: '100%',
                minWidth: 0,
            }
            : {
                alignSelf: 'flex-start',
                minWidth: 0,
            }),
    },
    textgroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        ...(fillWidth
            ? {
                width: '100%',
                minWidth: 0,
            }
            : {
                alignSelf: 'flex-start',
                minWidth: 0,
            }),
    },
    text: {
        color: isUser ? '#FFFFFF' : '#1F2937',
        flexShrink: 1,
    },
    heading1: {
        color: isUser ? '#FFFFFF' : '#111827',
        fontSize: 21,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 8,
    },
    heading2: {
        color: isUser ? '#FFFFFF' : '#111827',
        fontSize: 19,
        fontWeight: '700',
        marginTop: 7,
        marginBottom: 7,
    },
    heading3: {
        color: isUser ? '#FFFFFF' : '#111827',
        fontSize: 17,
        fontWeight: '700',
        marginTop: 6,
        marginBottom: 6,
    },
    bullet_list: {
        marginBottom: 8,
    },
    ordered_list: {
        marginBottom: 8,
    },
    list_item: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        color: isUser ? '#FFFFFF' : '#1F2937',
        marginBottom: 6,
    },
    bullet_list_icon: {
        color: isUser ? '#FFFFFF' : '#1F2937',
        marginLeft: 2,
        marginRight: 10,
        marginTop: 1,
    },
    bullet_list_content: {
        flex: 1,
        paddingRight: 2,
    },
    ordered_list_icon: {
        color: isUser ? '#FFFFFF' : '#1F2937',
        marginLeft: 2,
        marginRight: 10,
        marginTop: 1,
    },
    ordered_list_content: {
        flex: 1,
        paddingRight: 2,
    },
    strong: {
        color: isUser ? '#FFFFFF' : '#111827',
        fontWeight: '700',
    },
    em: {
        color: isUser ? '#EDE9FE' : '#374151',
        fontStyle: 'italic',
    },
    link: {
        color: isUser ? '#E9D5FF' : '#2563EB',
        textDecorationLine: 'underline',
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: isUser ? '#C4B5FD' : '#CBD5E1',
        paddingLeft: 11,
        marginLeft: 0,
        marginBottom: 12,
        opacity: 0.95,
    },
    hr: {
        backgroundColor: isUser ? 'rgba(255,255,255,0.3)' : '#E5E7EB',
        height: 1,
    },
    table: {
        borderWidth: 1,
        borderColor: isUser ? '#7C3AED' : '#EEF2FF',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: isUser ? 'rgba(0,0,0,0.02)' : '#fff',
    },
    thead: {
        backgroundColor: isUser ? 'rgba(124,58,237,0.4)' : '#F5F3FF',
    },
    th: {
        color: isUser ? '#FFFFFF' : '#6D28D9',
        fontWeight: '800',
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 13,
    },
    td: {
        color: isUser ? '#FFFFFF' : '#374151',
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 13,
        borderTopWidth: 1,
        borderTopColor: isUser ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
    },
    code_inline: {
        color: isUser ? '#E0E7FF' : '#4338CA',
        backgroundColor: isUser ? 'rgba(139,92,246,0.42)' : '#EEF2FF',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        overflow: 'hidden',
        fontSize: 13,
    },
    code_block: {
        color: isUser ? '#F5F3FF' : '#E5E7EB',
        backgroundColor: isUser ? '#4C1D95' : '#111827',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 9,
        fontFamily: 'Courier',
        marginBottom: 10,
    },
});

export default function ChatMarkdownMessage({ content, isUser, fillWidth = true }: ChatMarkdownMessageProps) {
    const [copiedBlockKey, setCopiedBlockKey] = useState<string | null>(null);
    const shouldFillWidth = fillWidth;

    const markdownStyles = useMemo(() => markdownStylesFor(isUser, shouldFillWidth), [isUser, shouldFillWidth]);
    const markdownit = useMemo(() => {
        const instance = MarkdownIt({ typographer: true });
        instance.use(mathMarkdownPlugin);
        return instance;
    }, []);
    const normalizedContent = useMemo(() => normalizeContent(content), [content]);
    const segments = useMemo(() => parseMarkdownSegments(normalizedContent), [normalizedContent]);

    const copyCode = async (code: string, blockKey: string) => {
        try {
            await Clipboard.setStringAsync(code.replace(/\n$/, ''));
            setCopiedBlockKey(blockKey);
            setTimeout(() => {
                setCopiedBlockKey((current) => (current === blockKey ? null : current));
            }, 1400);
        } catch {
            Alert.alert('Loi', 'Khong the sao chep doan code luc nay.');
        }
    };

    const renderHighlightedCodeBlock = (language: string, rawCode: string, blockKey: string) => {
        const normalizedLanguage = normalizeCodeLanguage(language);
        const code = (rawCode || '[Khong the hien thi noi dung code]').replace(/\n$/, '');
        const copied = copiedBlockKey === blockKey;

        return (
            <View
                key={blockKey}
                style={[
                    styles.codeBlock,
                    isUser ? styles.codeBlockUser : styles.codeBlockAi,
                ]}
            >
                <View style={styles.codeHeader}>
                    <Text style={styles.codeLanguage}>{normalizedLanguage.toUpperCase()}</Text>
                    <TouchableOpacity
                        style={[styles.copyButton, copied && styles.copyButtonCopied]}
                        onPress={() => copyCode(code, blockKey)}
                    >
                        <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={14} color="#E5E7EB" />
                        <Text style={styles.copyText}>{copied ? 'Da sao chep' : 'Copy'}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    directionalLockEnabled={true}
                    alwaysBounceVertical={false}
                    style={styles.codeScroll}
                    contentContainerStyle={styles.codeScrollContent}
                >
                    <View style={styles.codeHighlighterWrap}>
                        <SyntaxHighlighter
                            language={normalizedLanguage}
                            highlighter="prism"
                            style={CODE_THEME}
                            customStyle={SYNTAX_STYLE}
                            fontFamily="Courier"
                            fontSize={13}
                            PreTag={View}
                            CodeTag={View}
                        >
                            {code}
                        </SyntaxHighlighter>
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderCodeBlock = (node: any) => {
        const language = normalizeCodeLanguage(getCodeLanguageFromNode(node));
        const rawCode = getCodeTextFromNode(node);
        const code = rawCode || '[Khong the hien thi noi dung code]';
        const blockKey = String(node?.key || `${language}-${code.length}-${String(code).slice(0, 16)}`);
        return renderHighlightedCodeBlock(language, code, blockKey);
    };

    const renderParsedCodeBlock = (language: string, rawCode: string, blockKey: string) => {
        return renderHighlightedCodeBlock(language, rawCode, blockKey);
    };

    const renderInlineMath = (latex: string, nodeKey: string) => {
        const safeLatex = normalizeMathBlockLatex(latex);
        const fallbackText = normalizeInlineMathText(latex) || '[Cong thuc]';

        return (
            <View key={nodeKey} style={styles.inlineMathWrap}>
                <MathView latex={safeLatex} fallbackText={fallbackText} isUser={isUser} inline={true} />
            </View>
        );
    };

    const renderBlockMath = (latex: string, nodeKey: string) => {
        const safeLatex = normalizeMathBlockLatex(latex);
        const fallbackText = normalizeMathBlockText(latex) || '[Cong thuc trong]';

        return (
            <View
                key={nodeKey}
                style={[
                    styles.mathBlock,
                    isUser ? styles.mathBlockUser : styles.mathBlockAi,
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    directionalLockEnabled={true}
                    alwaysBounceHorizontal={true}
                    persistentScrollbar={true}
                    style={styles.mathScroll}
                    contentContainerStyle={styles.mathScrollContent}
                >
                    <View style={styles.mathRendererWrap}>
                        <MathView latex={safeLatex} fallbackText={fallbackText} isUser={isUser} />
                    </View>
                </ScrollView>
            </View>
        );
    };

    const markdownRules = useMemo(() => ({
        fence: (node: any) => renderCodeBlock(node),
        code_block: (node: any) => renderCodeBlock(node),
        math_inline: (node: any) => renderInlineMath(node.content, node.key),
        math_block: (node: any) => renderBlockMath(node.content, node.key),
        softbreak: (node: any) => (
            <Text key={node.key}>
                {' '}
            </Text>
        ),
    }), [copiedBlockKey, isUser]);

    return (
        <View style={[styles.root, shouldFillWidth ? styles.rootFill : styles.rootAuto]}>
            {segments.map((segment) => {
                if (segment.type === 'code') {
                    return renderParsedCodeBlock(segment.language || 'text', segment.text, segment.key);
                }

                return (
                    <View
                        key={segment.key}
                        style={[
                            styles.markdownSegment,
                            shouldFillWidth ? styles.markdownSegmentFill : styles.markdownSegmentAuto,
                        ]}
                    >
                        <Markdown markdownit={markdownit as any} style={markdownStyles as any} rules={markdownRules as any}>
                            {segment.text}
                        </Markdown>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        maxWidth: '100%',
        minWidth: 0,
    },
    rootFill: {
        width: '100%',
        alignSelf: 'stretch',
    },
    rootAuto: {
        alignSelf: 'flex-start',
    },
    markdownSegment: {
        maxWidth: '100%',
        minWidth: 0,
    },
    markdownSegmentFill: {
        width: '100%',
    },
    markdownSegmentAuto: {
        alignSelf: 'flex-start',
    },
    mathBlock: {
        width: '100%',
        borderRadius: 12,
        marginTop: MATH_BLOCK_VERTICAL_MARGIN,
        marginBottom: MATH_BLOCK_VERTICAL_MARGIN,
        overflow: 'hidden',
    },
    mathBlockUser: {
        backgroundColor: 'transparent',
    },
    mathBlockAi: {
        backgroundColor: 'transparent',
    },
    mathScroll: {
        width: '100%',
        maxWidth: '100%',
        flexGrow: 0,
    },
    mathScrollContent: {
        paddingHorizontal: 10,
        paddingVertical: MATH_BLOCK_VERTICAL_PADDING,
        minWidth: '100%',
        alignItems: 'flex-start',
    },
    mathRendererWrap: {
        alignSelf: 'flex-start',
        flexShrink: 0,
        overflow: 'visible',
    },
    inlineMathWrap: {
        marginHorizontal: 2,
        marginVertical: INLINE_MATH_VERTICAL_MARGIN,
        justifyContent: 'center',
        maxWidth: '100%',
        flexShrink: 1,
    },
    mathText: {
        fontFamily: 'Courier',
        fontSize: 15,
        lineHeight: 24,
    },
    mathTextUser: {
        color: '#F5F3FF',
    },
    mathTextAi: {
        color: '#1F2937',
    },
    codeBlock: {
        width: '100%',
        maxWidth: '100%',
        alignSelf: 'stretch',
        borderRadius: 14,
        marginTop: 2,
        marginBottom: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    codeBlockUser: {
        backgroundColor: '#4C1D95',
        borderColor: '#6D28D9',
    },
    codeBlockAi: {
        backgroundColor: '#111827',
        borderColor: '#1F2937',
    },
    codeHeader: {
        height: 36,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
    },
    codeLanguage: {
        color: '#A5B4FC',
        fontSize: 11,
        fontWeight: '700',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    copyButtonCopied: {
        backgroundColor: 'rgba(5,150,105,0.35)',
    },
    copyText: {
        color: '#E5E7EB',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 5,
    },
    codeScroll: {
        width: '100%',
        maxWidth: '100%',
        flexGrow: 0,
    },
    codeScrollContent: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexGrow: 0,
        minWidth: '100%',
        alignItems: 'flex-start',
    },
    codeHighlighterWrap: {
        alignSelf: 'flex-start',
        flexShrink: 0,
        minWidth: '100%',
    },
});
