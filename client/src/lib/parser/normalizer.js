export function normalizeText(rawText) {
    if (typeof rawText !== 'string' || !rawText) return '';

    return rawText
        .replace(/\r\n/g, '\n')                  
        .replace(/\r/g, '\n')                    
        .replace(/\t/g, '    ')                  
        .replace(/[\u201C\u201D]/g, '"')          
        .replace(/[\u2018\u2019]/g, "'")          
        .replace(/\u2014/g, '---')               
        .replace(/[ \t]+\n/g, '\n')              
        .replace(/\n{3,}/g, '\n\n');             
}