function generateStableId(content, index) {
    let hash = 0;
    const str = `${content}_${index}_${Date.now().toString(36).slice(-4)}`;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return `node_${Math.abs(hash).toString(36)}`;
}

export function buildAST(tokens) {
    const doc = { type: 'doc', content: [] };
    let activeDialogueNode = null;

    const sceneMap = {};
    tokens.forEach(token => {
        if (token.type === 'SCENE_HEADING') {
            const stableId = generateStableId(token.value || 'blank', token.lineIndex);
            sceneMap[token.value] = stableId;
        }
    });

    const flushDialogue = () => {
        if (activeDialogueNode) {
            if (activeDialogueNode.content.length === 0) {
                activeDialogueNode.content.push({ type: 'paragraph' });
            }
            doc.content.push(activeDialogueNode);
            activeDialogueNode = null;
        }
    };

    const createParagraph = (text) => {
        if (!text || text.trim() === '') return { type: 'paragraph' };
        return { type: 'paragraph', content: [{ type: 'text', text }] };
    };

    tokens.forEach((token) => {
        switch (token.type) {
            case 'BLANK_LINE':
                flushDialogue();
                break;

            case 'SCENE_HEADING':
                flushDialogue();
                doc.content.push({
                    type: 'sceneBreak',
                    attrs: { sceneId: sceneMap[token.value], title: token.value || 'UNTITLED' }
                });
                break;

            case 'SPEAKER':
                flushDialogue();
                activeDialogueNode = {
                    type: 'dialogue',
                    attrs: { speaker: token.value || 'UNKNOWN' },
                    content: []
                };
                break;

            case 'DIALOGUE_LINE':
                if (activeDialogueNode) {
                    activeDialogueNode.content.push(createParagraph(token.value));
                }
                break;

            case 'BRANCH':
                const targetId = token.target && sceneMap[token.target] ? sceneMap[token.target] : null;
                const decNode = {
                    type: 'decision',
                    attrs: { targetId: targetId, targetName: token.target || null, effects: [] },
                    content: token.text ? [{ type: 'text', text: token.text }] : undefined
                };

                if (activeDialogueNode) {
                    activeDialogueNode.content.push(decNode);
                } else {
                    flushDialogue();
                    doc.content.push(decNode);
                }
                break;

            case 'PROSE':
                flushDialogue();
                doc.content.push(createParagraph(token.value));
                break;
        }
    });

    flushDialogue();
    if (doc.content.length === 0) doc.content.push({ type: 'paragraph' });

    return doc;
}