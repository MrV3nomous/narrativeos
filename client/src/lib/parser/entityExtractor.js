export function extractEntities(ast) {
    const entities = {
        characters: new Set(),
        scenes: []
    };

    if (!ast?.content || !Array.isArray(ast.content)) return { characters: [], scenes: [] };

    ast.content.forEach(node => {
        if (node?.type === 'sceneBreak' && node?.attrs?.sceneId) {
            entities.scenes.push({
                id: node.attrs.sceneId,
                title: node.attrs.title || 'UNTITLED'
            });
        }

        if (node?.type === 'dialogue' && node?.attrs?.speaker) {
            const speaker = node.attrs.speaker.trim().toUpperCase();
            if (speaker !== 'SYSTEM' && speaker !== 'UNKNOWN' && speaker !== '') {
                entities.characters.add(speaker);
            }
        }
    });

    return {
        characters: Array.from(entities.characters),
        scenes: entities.scenes
    };
}