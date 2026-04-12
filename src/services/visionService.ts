import type { ApplicationUsage, ExtractedScreenTimeData } from '../types/domain';
import {
  normalizeAppName,
  parseDurationToMinutes,
  sanitizeApplications,
} from '../utils/parsing';

interface VisionApiApplication {
  name?: string;
  minutesSpent?: number | string;
  minutes?: number | string;
  duration?: string;
}

interface VisionApiPayload {
  applications?: VisionApiApplication[];
  totalMinutes?: number | string;
  extractedText?: string;
  text?: string;
}

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface GeminiRuntime {
  configured: boolean;
  missingKeys: string[];
}

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const geminiModel = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash';
const geminiBaseUrl =
  import.meta.env.VITE_GEMINI_BASE_URL ??
  'https://generativelanguage.googleapis.com/v1beta';

export const geminiRuntime: GeminiRuntime = {
  configured: Boolean(geminiApiKey),
  missingKeys: geminiApiKey ? [] : ['VITE_GEMINI_API_KEY'],
};

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

function parseApplicationsFromText(text: string): ApplicationUsage[] {
  const applications: ApplicationUsage[] = [];
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

    applications.push({
      name: normalizeAppName(rawName),
      minutesSpent,
    });
  }

  return sanitizeApplications(applications);
}

function parseVisionPayload(
  payload: VisionApiPayload,
  startDate: string,
  endDate: string,
  daysInRange: number,
  totalAverageMinutes: number,
): ExtractedScreenTimeData {
  const apiApplications = payload.applications ?? [];

  const applicationsFromList: ApplicationUsage[] = apiApplications
    .map((app) => {
      const name = normalizeAppName(app.name ?? 'Other');

      const minutesSource = app.minutesSpent ?? app.minutes ?? app.duration ?? 0;
      const minutesSpent = parseDurationToMinutes(minutesSource);

      return {
        name,
        minutesSpent,
      };
    })
    .filter((app) => app.minutesSpent > 0);

  const text = payload.extractedText ?? payload.text ?? '';
  const applicationsFromText = text ? parseApplicationsFromText(text) : [];

  const applications = sanitizeApplications([
    ...applicationsFromList,
    ...applicationsFromText,
  ]);

  if (applications.length === 0 && totalAverageMinutes <= 0) {
    throw new Error('No valid application durations were extracted from the screenshot.');
  }

  return {
    startDate,
    endDate,
    daysInRange,
    totalAverageMinutes,
    applications,
    rawText: text,
  };
}

function parseJsonFromModelText(modelText: string): VisionApiPayload {
  const trimmed = modelText.trim();

  const fencedBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedBlock?.[1]) {
    return JSON.parse(fencedBlock[1]) as VisionApiPayload;
  }

  try {
    return JSON.parse(trimmed) as VisionApiPayload;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');

    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as VisionApiPayload;
    }

    throw new Error('Gemini did not return valid JSON for extraction.');
  }
}

function readGeminiText(response: GeminiResponse): string {
  const parts = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string' && text.trim().length > 0);

  if (!parts || parts.length === 0) {
    throw new Error('Gemini returned no text output for extraction.');
  }

  return parts.join('\n');
}

export async function extractScreenTimeFromImage(
  imageFile: File,
  startDate: string,
  endDate: string,
  daysInRange: number,
  totalAverageMinutes: number,
): Promise<ExtractedScreenTimeData> {
  if (!geminiApiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add your Gemini API key in .env.');
  }

  const base64Image = await fileToBase64(imageFile);
  const requestUrl = `${geminiBaseUrl}/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

  const prompt =
    'Extract individual application screen-time data from this screenshot. ' +
    'Return only JSON with this shape: {"applications":[{"name":"string","minutesSpent":number}],"extractedText":"string"}. ' +
    'Use minutes as integers and include only positive values. ' +
    'Do NOT try to extract or infer dates from the screenshot.';

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: imageFile.type || 'image/png',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini request failed (${response.status}). ${details}`.trim());
  }

  const geminiPayload = (await response.json()) as GeminiResponse;
  const modelText = readGeminiText(geminiPayload);
  const payload = parseJsonFromModelText(modelText);
  return parseVisionPayload(
    payload,
    startDate,
    endDate,
    daysInRange,
    totalAverageMinutes,
  );
}
