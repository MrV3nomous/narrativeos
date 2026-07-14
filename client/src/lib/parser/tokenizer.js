export function tokenize(text, format) {
    const lines = text.split('\n');
    const tokens = [];
    let state = 'PROSE';

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
            tokens.push({ type: 'BLANK_LINE', lineIndex: index });
            state = 'PROSE';
            return;
        }

        if (trimmed.startsWith('---') || trimmed.match(/^(INT\.|EXT\.)/i)) {
            const title = trimmed.replace(/^(---\s*|INT\.\s*|EXT\.\s*)/i, '').trim().toUpperCase();
            tokens.push({ type: 'SCENE_HEADING', value: title || 'UNTITLED_SCENE', lineIndex: index });
            state = 'PROSE';
            return;
        }

        const branchMatch = trimmed.match(/^>\s*(.*?)(?:\s*->\s*([^\[]*?))?(?:\s*\[(.*?)\])?$/);
        if (branchMatch) {
            tokens.push({
                type: 'BRANCH',
                text: branchMatch[1].trim(),
                target: branchMatch[2] ? branchMatch[2].trim().toUpperCase() : null,
                effectsStr: branchMatch[3] ? branchMatch[3].trim() : null,
                lineIndex: index
            });
            state = 'PROSE';
            return;
        }

        const dialogueMatch = trimmed.match(/^([a-zA-Z0-9 \-_']+):\s*(.*)$/);
        if (dialogueMatch) {
            const speaker = dialogueMatch[1].trim().toUpperCase();
            const text = dialogueMatch[2].trim();

            tokens.push({ type: 'SPEAKER', value: speaker, lineIndex: index });
            if (text) {
                tokens.push({ type: 'DIALOGUE_LINE', value: text, lineIndex: index });
            }
            state = 'DIALOGUE';
            return;
        }

        if (state === 'DIALOGUE') {
            tokens.push({ type: 'DIALOGUE_LINE', value: trimmed, lineIndex: index });
            return;
        }

        tokens.push({ type: 'PROSE', value: trimmed, lineIndex: index });
    });

    return tokens;
}