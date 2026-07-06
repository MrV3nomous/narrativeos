const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, '../content/case_01.txt');
const outputFilePath = path.join(__dirname, '../client/src/ir.json');

function compile(inputPath, outputPath) {
    const rawText = fs.readFileSync(inputPath, 'utf8');
    const lines = rawText.split('\n');

    const ir = {
        engine: "2.0.0",
        scenes: {}
    };

    let currentScene = null;
    let currentSpeaker = "SYSTEM";
    let buildErrors = [];

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('# SCENE:')) {
            currentScene = trimmed.replace('# SCENE:', '').trim();
            ir.scenes[currentScene] = { instructions: [] };
            return;
        }

        if (!currentScene) {
            buildErrors.push(`Line ${lineNumber}: Instruction found outside of a scene block.`);
            return;
        }

        if (trimmed.startsWith('@emit')) {
            ir.scenes[currentScene].instructions.push({
                type: 'emit',
                event: trimmed.replace('@emit', '').trim()
            });
            return;
        }

        if (trimmed.startsWith('@set')) {
            ir.scenes[currentScene].instructions.push({
                type: 'set',
                expression: trimmed.replace('@set', '').trim()
            });
            return;
        }

        
        if (trimmed.startsWith('@schedule')) {
            const scheduleMatch = trimmed.match(/@schedule\s+(.*?)\s+->\s+@emit\s+(.*?)\s+->\s+SCENE:\s+(.*)/);
            if (scheduleMatch) {
                ir.scenes[currentScene].instructions.push({
                    type: 'schedule',
                    time: scheduleMatch[1].trim(),
                    emitEvent: scheduleMatch[2].trim(),
                    target: scheduleMatch[3].trim()
                });
            } else {
                buildErrors.push(`Line ${lineNumber}: Malformed @schedule command.`);
            }
            return;
        }

        if (trimmed.endsWith(':') && !trimmed.startsWith('@') && !trimmed.startsWith('#')) {
            currentSpeaker = trimmed.slice(0, -1).trim();
            return;
        }

        if (trimmed.includes('- [')) {
            const conditionalMatch = trimmed.match(/IF\s+\{\{(.*?)\}\}\s+(==|!=|>|<|>=|<=)\s+(.*?)\s+-\s+\[(.*?)\]\s+->\s+SCENE:\s+(.*)/);

            if (conditionalMatch) {
                const choiceText = conditionalMatch[4].trim();
                ir.scenes[currentScene].instructions.push({
                    type: 'choice',
                    condition: {
                        variable: conditionalMatch[1].trim(),
                        operator: conditionalMatch[2].trim(),
                        value: conditionalMatch[3].trim()
                    },
                    text: choiceText.replace('@prompt:', '').trim(),
                    isPrompt: choiceText.startsWith('@prompt:'),
                    target: conditionalMatch[5].trim()
                });
                return;
            }

            const standardMatch = trimmed.match(/-\s+\[(.*?)\]\s+->\s+SCENE:\s+(.*)/);
            if (standardMatch) {
                const choiceText = standardMatch[1].trim();
                ir.scenes[currentScene].instructions.push({
                    type: 'choice',
                    text: choiceText.replace('@prompt:', '').trim(),
                    isPrompt: choiceText.startsWith('@prompt:'),
                    target: standardMatch[2].trim()
                });
                return;
            }
        }

        if (!trimmed.startsWith('#') && !trimmed.startsWith('@') && !trimmed.startsWith('-')) {
            ir.scenes[currentScene].instructions.push({
                type: 'dialogue',
                speaker: currentSpeaker,
                text: trimmed
            });
            return;
        }
    });

    
    const allSceneKeys = Object.keys(ir.scenes);

    allSceneKeys.forEach(sceneKey => {
        const instructions = ir.scenes[sceneKey].instructions;
        instructions.forEach((inst, index) => {
            if (inst.type === 'choice' && !allSceneKeys.includes(inst.target)) {
                buildErrors.push(`Validation Error in [${sceneKey}]: Choice points to missing scene '${inst.target}'`);
            }
            if (inst.type === 'schedule' && !allSceneKeys.includes(inst.target)) {
                buildErrors.push(`Validation Error in [${sceneKey}]: Schedule points to missing scene '${inst.target}'`);
            }
        });
    });

    if (buildErrors.length > 0) {
        console.error("\n❌ COMPILATION FAILED. Fix the following errors:");
        buildErrors.forEach(err => console.error("  - " + err));
        console.error("\n");
        process.exit(1);
    }

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(ir, null, 2));
    console.log(`✅ Compiler Success: Validated IR generated at ${outputPath}`);
}

compile(inputFilePath, outputFilePath);