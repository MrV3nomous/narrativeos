import { normalizeText } from './normalizer';
import { detectFormat } from './formatDetector';
import { tokenize } from './tokenizer';
import { buildAST } from './structuralParser';
import { extractEntities } from './entityExtractor';
import { validateAST } from './validator';

export function parseDocument(rawText) {
    const startTime = performance.now();

    try {
        const normalizedText = normalizeText(rawText);
        const formatInfo = detectFormat(normalizedText);
        const tokens = tokenize(normalizedText, formatInfo.format);
        const ast = buildAST(tokens);
        const entities = extractEntities(ast);
        const diagnostics = validateAST(ast, entities);

        const endTime = performance.now();

        return {
            document: ast,
            entities: entities,
            diagnostics: diagnostics,
            statistics: {
                wordCount: normalizedText.trim().split(/\s+/).length,
                nodeCount: ast.content.length,
                parseTimeMs: Math.round(endTime - startTime)
            },
            metadata: {
                format: formatInfo.format,
                formatConfidence: formatInfo.confidence,
                parserVersion: '1.0.1',
                compiledAt: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error("Critical Parser Error:", error);
        return {
            document: { type: 'doc', content: [{ type: 'paragraph' }] },
            entities: { characters: [], scenes: [] },
            diagnostics: [{ level: 'critical', message: 'Parser failed to process document.' }],
            statistics: { wordCount: 0, nodeCount: 0, parseTimeMs: 0 },
            metadata: { format: 'UNKNOWN', formatConfidence: 0 }
        };
    }
}