// src/lib/Compiler.js

export function compileDocumentToKernel(documentModel) {
    if (!documentModel || !documentModel.content || !Array.isArray(documentModel.content)) {
        return { scenes: {} };
    }

    const kernel = {
        scenes: {},
        metadata: {
            compiledAt: new Date().toISOString(),
            version: '1.0.0'
        }
    };

    let currentSceneId = 'intro-scene';
    kernel.scenes[currentSceneId] = { id: currentSceneId, title: 'START', instructions: [] };

    const extractText = (node) => {
        if (!node?.content || !Array.isArray(node.content)) return '';
        return node.content.map(child => child?.text || '').join('');
    };

    documentModel.content.forEach(block => {
        if (!block?.type) return;

        if (block.type === 'sceneBreak') {
            currentSceneId = block.attrs?.sceneId || `scene_${Date.now()}`;
            kernel.scenes[currentSceneId] = {
                id: currentSceneId,
                title: block.attrs?.title || 'UNTITLED',
                instructions: []
            };
            return;
        }

        if (!kernel.scenes[currentSceneId]) return;

        if (block.type === 'paragraph') {
            const text = extractText(block);
            if (text.trim() === '') return;

            kernel.scenes[currentSceneId].instructions.push({
                type: 'dialogue',
                speaker: 'SYSTEM',
                text: text
            });
            return;
        }

        if (block.type === 'dialogue') {
            const speaker = block.attrs?.speaker || 'UNKNOWN';

            if (block.content && Array.isArray(block.content)) {
                block.content.forEach(innerBlock => {
                    if (!innerBlock?.type) return;

                    if (innerBlock.type === 'paragraph') {
                        const text = extractText(innerBlock);
                        if (text.trim() !== '') {
                            kernel.scenes[currentSceneId].instructions.push({
                                type: 'dialogue',
                                speaker: speaker,
                                text: text
                            });
                        }
                    }

                    if (innerBlock.type === 'decision') {
                        const text = extractText(innerBlock);
                        const target = innerBlock.attrs?.targetId || null;
                        const effects = innerBlock.attrs?.effects || [];

                        kernel.scenes[currentSceneId].instructions.push({
                            type: 'choice',
                            text: text || '[EMPTY CHOICE]',
                            target: target,
                            effects: effects
                        });
                    }
                });
            }
            return;
        }

        if (block.type === 'decision') {
            const text = extractText(block);
            const target = block.attrs?.targetId || null;
            const effects = block.attrs?.effects || [];

            kernel.scenes[currentSceneId].instructions.push({
                type: 'choice',
                text: text || '[EMPTY CHOICE]',
                target: target,
                effects: effects
            });
            return;
        }
    });

    if (kernel.scenes['intro-scene']?.instructions.length === 0) {
        delete kernel.scenes['intro-scene'];
    }

    return kernel;
}