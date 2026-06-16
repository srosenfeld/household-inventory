import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function mockEmbedding(text: string): number[] {
  const vec = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 1536] += text.charCodeAt(i) / 1000;
  }
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / magnitude);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    return mockEmbedding(text);
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

export function embeddingToPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

export function itemEmbeddingText(name: string, description: string | null, category: string): string {
  return `${name} ${description ?? ''} ${category}`.trim();
}
