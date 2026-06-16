import OpenAI from 'openai';
import type { DraftItem, ItemCategory } from '@household-inventory/shared';
import { ITEM_CATEGORIES } from '@household-inventory/shared';
import { v4 as uuidv4 } from 'uuid';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface VisionItem {
  name: string;
  description?: string;
  category: string;
  quantity_estimate?: number;
  confidence?: number;
  attributes?: Record<string, string>;
}

function normalizeCategory(category: string): ItemCategory {
  const lower = category.toLowerCase();
  if ((ITEM_CATEGORIES as readonly string[]).includes(lower)) {
    return lower as ItemCategory;
  }
  return 'other';
}

function mockIdentifyItems(): DraftItem[] {
  return [
    {
      tempId: uuidv4(),
      name: 'Hammer',
      description: 'Claw hammer with wooden handle',
      category: 'tools',
      quantity: 1,
      confidence: 0.85,
      attributes: { color: 'red' },
    },
    {
      tempId: uuidv4(),
      name: 'Screwdriver set',
      description: 'Phillips and flathead screwdrivers',
      category: 'tools',
      quantity: 1,
      confidence: 0.78,
    },
    {
      tempId: uuidv4(),
      name: 'Tape measure',
      description: '25-foot retractable tape measure',
      category: 'tools',
      quantity: 1,
      confidence: 0.72,
    },
  ];
}

export async function identifyItemsFromImage(imagePath: string): Promise<DraftItem[]> {
  if (!openai) {
    return mockIdentifyItems();
  }

  const fs = await import('fs');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You identify household items in storage photos. Return JSON: { "items": [{ "name", "description", "category", "quantity_estimate", "confidence", "attributes" }] }. Categories: ${ITEM_CATEGORIES.join(', ')}.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Identify all visible items in this storage area photo.' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
        ],
      },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content ?? '{"items":[]}';
  const parsed = JSON.parse(content) as { items: VisionItem[] };

  return (parsed.items ?? []).map((item) => ({
    tempId: uuidv4(),
    name: item.name,
    description: item.description,
    category: normalizeCategory(item.category),
    quantity: item.quantity_estimate ?? 1,
    confidence: item.confidence,
    attributes: item.attributes,
  }));
}

export async function suggestNames(
  context: string,
  type?: string
): Promise<Array<{ name: string; confidence: number }>> {
  if (!openai) {
    const base = type ? `${type} area` : 'Storage area';
    return [
      { name: `${base} A`, confidence: 0.9 },
      { name: `${base} B`, confidence: 0.85 },
      { name: `Main ${base}`, confidence: 0.8 },
    ];
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Suggest 3 short descriptive names for a household storage area. Return JSON: { "suggestions": [{ "name", "confidence" }] }.',
      },
      {
        role: 'user',
        content: `Context: ${context}${type ? `. Type: ${type}` : ''}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? '{"suggestions":[]}';
  const parsed = JSON.parse(content) as { suggestions: Array<{ name: string; confidence: number }> };
  return parsed.suggestions ?? [];
}

export function parseSearchQuery(rawQuery: string): string {
  const cleaned = rawQuery
    .replace(/^(where is (my |the )?|find (my |the )?|locate (my |the )?)/i, '')
    .replace(/\?$/, '')
    .trim();
  return cleaned || rawQuery.trim();
}
