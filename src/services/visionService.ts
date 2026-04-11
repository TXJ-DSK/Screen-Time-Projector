import type { ExtractedScreenTimeData, ScreenTimeCategory } from '../types/domain';
import { toDateKey } from '../utils/date';
import {
  normalizeCategoryName,
  parseDurationToMinutes,
  sanitizeCategories,
  sumCategoryMinutes,
} from '../utils/parsing';

interface VisionApiCategory {
  name?: string;
  minutesSpent?: number | string;
  minutes?: number | string;
  duration?: string;
}

interface VisionApiPayload {
  categories?: VisionApiCategory[];
  totalMinutes?: number | string;
  extractedText?: string;
  text?: string;
}

const visionEndpoint = import.meta.env.VITE_VISION_API_URL;
const visionApiKey = import.meta.env.VITE_VISION_API_KEY;

async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== 'string') {
        reject(new Error('Could not read the screenshot as a data URL.'));
        return;
      }

      const [, base64 = ''] = value.split(',');
      resolve(base64);
    };

    reader.onerror = () => reject(new Error('Failed to read the screenshot file.'));
    reader.readAsDataURL(file);
  });
}

function parseCategoriesFromText(text: string): ScreenTimeCategory[] {
  const categories: ScreenTimeCategory[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const match = trimmed.match(
      /^([A-Za-z][A-Za-z\s&/-]{1,40}?)\s*[:-]?\s*((?:\d+\s*h(?:ours?)?\s*)?(?:\d+\s*m(?:in(?:utes?)?)?)|\d+)$/i,
    );

    if (!match) {
      continue;
    }

    const rawName = match[1] ?? '';
    const rawDuration = match[2] ?? '';
    const minutesSpent = parseDurationToMinutes(rawDuration);

    if (minutesSpent <= 0) {
      continue;
    }

    categories.push({
      name: normalizeCategoryName(rawName),
      minutesSpent,
    });
  }

  return sanitizeCategories(categories);
}

function parseVisionPayload(payload: VisionApiPayload): ExtractedScreenTimeData {
  const apiCategories = payload.categories ?? [];

  const categoriesFromList: ScreenTimeCategory[] = apiCategories
    .map((category) => {
      const name = normalizeCategoryName(category.name ?? 'Other');

      const minutesSource =
        category.minutesSpent ?? category.minutes ?? category.duration ?? 0;
      const minutesSpent = parseDurationToMinutes(minutesSource);

      return {
        name,
        minutesSpent,
      };
    })
    .filter((category) => category.minutesSpent > 0);

  const text = payload.extractedText ?? payload.text ?? '';
  const categoriesFromText = text ? parseCategoriesFromText(text) : [];

  const categories = sanitizeCategories([...categoriesFromList, ...categoriesFromText]);
  const inferredTotal = sumCategoryMinutes(categories);
  const totalMinutes = Math.max(
    inferredTotal,
    parseDurationToMinutes(payload.totalMinutes ?? inferredTotal),
  );

  if (categories.length === 0 || totalMinutes <= 0) {
    throw new Error('No valid category durations were extracted from the screenshot.');
  }

  return {
    dateKey: toDateKey(new Date()),
    totalMinutes,
    categories,
    rawText: text,
  };
}

export async function extractScreenTimeFromImage(
  imageFile: File,
): Promise<ExtractedScreenTimeData> {
  if (!visionEndpoint) {
    throw new Error(
      'Missing VITE_VISION_API_URL. Set it to your OCR/vision endpoint in .env.',
    );
  }

  const base64Image = await fileToBase64(imageFile);

  const response = await fetch(visionEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(visionApiKey ? { Authorization: `Bearer ${visionApiKey}` } : {}),
    },
    body: JSON.stringify({
      imageBase64: base64Image,
      mimeType: imageFile.type,
      fileName: imageFile.name,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Vision API request failed (${response.status}). ${details}`.trim());
  }

  const payload = (await response.json()) as VisionApiPayload;
  return parseVisionPayload(payload);
}
