export function validateAST(ast, entities) {
    const diagnostics = [];
    const knownSceneIds = new Set((entities?.scenes || []).map(s => s.id));

    if (!ast?.content || !Array.isArray(ast.content)) return diagnostics;

    ast.content.forEach((node, index) => {
        if (node?.type === 'decision' && !node?.attrs?.targetId) {
            diagnostics.push({
                level: 'warning',
                message: `Branch found with no target destination.`,
                nodeIndex: index
            });
        }

        if (node?.type === 'decision' && node?.attrs?.targetId) {
            if (!knownSceneIds.has(node.attrs.targetId)) {
                diagnostics.push({
                    level: 'critical',
                    message: `Branch targets a Scene ID that no longer exists.`,
                    nodeIndex: index
                });
            }
        }

        if (node?.type === 'sceneBreak') {
            const nextNode = ast.content[index + 1];
            if (!nextNode || nextNode.type === 'sceneBreak') {
                diagnostics.push({
                    level: 'info',
                    message: `Scene '${node?.attrs?.title || 'Untitled'}' is currently empty.`,
                    nodeIndex: index
                });
            }
        }
    });

    return diagnostics;
}