"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTF = calculateTF;
exports.calculateIDF = calculateIDF;
exports.calculateTFIDF = calculateTFIDF;
function calculateTF(documents) {
    const tf = {};
    let totalWords = 0;
    for (const doc of documents) {
        const words = doc.split(/\W+/);
        totalWords += words.length;
        for (const word of words) {
            let lowerWord = word.toLowerCase();
            if (!tf[lowerWord]) {
                tf[lowerWord] = { count: 0, docs: new Set() };
            }
            tf[lowerWord].count++;
            tf[lowerWord].docs.add(doc);
        }
    }
    // Normalize TF
    for (const word in tf) {
        tf[word].tf = tf[word].count / totalWords;
    }
    return tf;
}
function calculateIDF(tf, totalDocs) {
    const idf = {};
    for (const word in tf) {
        idf[word] = Math.log(totalDocs / tf[word].docs.size);
    }
    return idf;
}
function calculateTFIDF(tf, idf) {
    const tfidf = {};
    for (const word in tf) {
        tfidf[word] = tf[word].tf * idf[word];
    }
    return tfidf;
}
