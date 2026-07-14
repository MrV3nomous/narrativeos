// src/lib/parser/formatDetector.js
export function detectFormat(text) {
    if (typeof text !== 'string') return { format: 'STANDARD_PROSE', confidence: 0.99 };

    const sample = text.slice(0, 5000); // Expanded sample window slightly for better detection

    const sceneHeaders = (sample.match(/^(INT\.|EXT\.|FADE IN:|---)/gm) || []).length;
    const dialogueBlocks = (sample.match(/^([A-Z0-9 \-_']+):\s/gm) || []).length;

    if (sceneHeaders > 1 && dialogueBlocks > 0) {
        return { format: 'SCREENPLAY', confidence: 0.95 };
    }

    if (dialogueBlocks > 3) {
        return { format: 'DIALOGUE_SCRIPT', confidence: 0.88 };
    }

    return { format: 'STANDARD_PROSE', confidence: 0.99 };
}