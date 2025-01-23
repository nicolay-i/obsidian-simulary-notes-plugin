## 1. calculateTF (Term Frequency)

This function calculates the frequency of each word in each document. It returns an object where each key is a word, and the value is an object with fields:
count: number of occurrences of the word in all documents.
docs: set of documents where the word appears.
tf: normalized frequency of the word in the document.

```typescript
function calculateTF(docs: any) {
    const tf: { [key: string]: any } = {};
    for (const doc of docs) {
        for (const word in doc) {
            tf[word] = tf[word] || { count: 0, docs: new Set() };
            tf[word].count++;
            tf[word].docs.add(doc);
        }
    }
    return tf;
}
```

## 2. calculateIDF (Inverse Document Frequency)

The function calculates the inverse document frequency for each word, which helps evaluate how important a word is across the entire corpus of documents. The IDF for a word is calculated as the logarithm of the ratio of the total number of documents to the number of documents containing this word.

```typescript
function calculateIDF(tf: any, totalDocs: number) {
    const idf: { [key: string]: number } = {};
    for (const word in tf) {
        idf[word] = Math.log(totalDocs / tf[word].docs.size);
    }
    return idf;
}
```

## 3. calculateTFIDF (Term Frequency-Inverse Document Frequency)

This function combines the results of calculateTF and calculateIDF to compute the weight of each word in each document. The TFIDF for a word is calculated as the product of its TF and IDF. This value shows the importance of a word in the context of a specific document compared to other documents.

```typescript
function calculateTFIDF(tf: any, idf: any) {
    const tfidf: { [key: string]: number } = {};
    for (const word in tf) {
        tfidf[word] = tf[word].tf * idf[word];
    }
    return tfidf;
}
```

## 4. cosineSimilarity (Cosine Similarity)

The function calculates the cosine similarity between two vectors (documents), which allows evaluating how similar two documents are to each other. The similarity is calculated as the ratio of the dot product of the vectors to the product of their norms. This value ranges from -1 to 1, where 1 indicates complete similarity.

```typescript
function cosineSimilarity(vecA: any, vecB: any) {
    const dotProduct = Object.keys(vecA).reduce((sum: number, key: string) => sum + (vecA[key] || 0) * (vecB[key] || 0), 0);
    const magnitudeA = Math.sqrt(Object.keys(vecA).reduce((sum, key) => sum + (vecA[key] || 0) ** 2, 0));
    const magnitudeB = Math.sqrt(Object.keys(vecB).reduce((sum, key) => sum + (vecB[key] || 0) ** 2, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}
```

## 5. Algorithm Usage

```typescript
const docs = ["hello world foo bar", "hello world foo baz", "hello world bar baz", "foo bar baz"];

const tf = calculateTF(docs);
const idf = calculateIDF(tf, docs.length);
const tfidf = calculateTFIDF(tf, idf);
const similarities = tfidfDocs.map((tfidfDoc, index) => ({
    document: filteredNotes[index].path,
    similarity: cosineSimilarity(tfidfDoc, targetTFIDF),
}));

const sortedSimilarities = similarities
    .sort((a, b) => b.similarity - a.similarity);
```

## Acknowledgments

- The TF-IDF algorithm was implemented based on information from [Wikipedia](https://en.wikipedia.org/wiki/Tf%E2%80%93idf).
- The main body of information was found using [Perplexity](https://www.perplexity.ai/).
- [Claude 3.5 Sonnet](https://www.anthropic.com/) was very helpful in the work. 