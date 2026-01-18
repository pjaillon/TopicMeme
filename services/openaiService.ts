import { NewsFeed } from "../types";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4o";

const responseSchema = {
  name: "news_feed",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      topic: { type: "string" },
      topStories: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            source: { type: "string" },
            url: { type: "string" },
            timestamp: { type: "string" },
            relatedSources: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  source: { type: "string" },
                  url: { type: "string" },
                  snippet: { type: "string" }
                },
                required: ["title", "source", "url", "snippet"]
              }
            }
          },
          required: ["id", "title", "summary", "source", "url", "timestamp", "relatedSources"]
        }
      },
      riverOfNews: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            source: { type: "string" },
            url: { type: "string" }
          },
          required: ["title", "source", "url"]
        }
      },
      sidebar: {
        type: "object",
        additionalProperties: false,
        properties: {
          quickLinks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                source: { type: "string" }
              },
              required: ["title", "url", "source"]
            }
          },
          trendingTopics: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["quickLinks", "trendingTopics"]
      }
    },
    required: ["topic", "topStories", "riverOfNews", "sidebar"]
  }
};

const extractOutputText = (data: any): string | null => {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const textParts = (data?.output ?? [])
    .flatMap((item: any) => item?.content ?? [])
    .filter((content: any) => content?.type === "output_text")
    .map((content: any) => content?.text)
    .filter((value: any) => typeof value === "string" && value.length);

  return textParts.length ? textParts.join("") : null;
};

const buildPrompt = (
  topic: string,
  counts: { topStories: number; riverOfNews: number; quickLinks: number; trendingTopics: number }
): string => `
  Perform a comprehensive web search for the latest news on the topic: "${topic}".

  STRICT REQUIREMENTS:
  1. Use ONLY actual, verified URLs found in your search results. DO NOT hallucinate or "predict" URLs.
  2. Prioritize breaking news and articles from the last 24-72 hours.
  3. Ensure the main "source" names match the actual publication found in the search results.

  Structure the response as a JSON object with this format:
  - "topic": The exact search topic.
  - "topStories": ${counts.topStories} major stories. Each must have:
     - "id": A unique string.
     - "title": The actual headline or a very close summary.
     - "summary": 1-2 short sentences of context (<= 220 chars).
     - "source": The publisher name (e.g., "The Verge", "Reuters").
     - "url": The exact valid link to the article.
     - "timestamp": A relative time string (e.g., "2 hours ago").
     - "relatedSources": 2-4 other real links/sources reporting on the same story. Keep snippets <= 140 chars.
  - "riverOfNews": ${counts.riverOfNews} shorter, recent news items with title, source, and valid URL.
  - "sidebar":
     - "quickLinks": ${counts.quickLinks} links to deep-dive analysis or official pages.
     - "trendingTopics": ${counts.trendingTopics} related search terms for navigation.
  If you cannot find enough results, expand the search query, but still return the exact counts above.
  Return a single JSON object only. Do not include markdown, code fences, or trailing text.
`;

const requestNews = async (
  topic: string,
  counts: { topStories: number; riverOfNews: number; quickLinks: number; trendingTopics: number },
  maxOutputTokens: number
): Promise<string> => {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      tools: [{ type: "web_search", search_context_size: "high" }],
      max_output_tokens: maxOutputTokens,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content: "You are a precise news aggregation engine. Return only JSON that matches the schema."
        },
        { role: "user", content: buildPrompt(topic, counts) }
      ],
      text: {
        format: {
          type: "json_schema",
          name: responseSchema.name,
          schema: responseSchema.schema,
          strict: responseSchema.strict
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);
  if (!outputText) {
    throw new Error("No response from OpenAI.");
  }

  return outputText;
};

// Curated sources to gently boost authority in the sort order.
const AUTHORITY_SOURCES = new Set([
  "reuters",
  "associated press",
  "ap",
  "bloomberg",
  "financial times",
  "the wall street journal",
  "wall street journal",
  "wsj",
  "the new york times",
  "new york times",
  "the washington post",
  "washington post",
  "the guardian",
  "bbc",
  "bbc news",
  "npr",
  "the economist",
  "al jazeera",
  "the verge",
  "wired",
  "arstechnica",
  "techcrunch"
]);

// Convert relative timestamps ("2 hours ago") into minutes for ranking.
const parseRelativeMinutes = (timestamp: string): number => {
  const value = timestamp.toLowerCase().trim();
  const match = value.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
  if (!match) return Number.POSITIVE_INFINITY;
  const amount = Number(match[1]);
  const unit = match[2];
  const minutesByUnit: Record<string, number> = {
    minute: 1,
    hour: 60,
    day: 1440,
    week: 10080,
    month: 43200,
    year: 525600
  };
  return amount * (minutesByUnit[unit] ?? 525600);
};

const scoreItem = (timestamp: string, source: string): number => {
  const minutes = parseRelativeMinutes(timestamp);
  const sourceKey = source.toLowerCase().trim();
  const authorityBoost = AUTHORITY_SOURCES.has(sourceKey) ? 0.15 : 0;
  if (!Number.isFinite(minutes)) {
    return -authorityBoost;
  }
  return -(minutes / 100000) + authorityBoost;
};

const sortByFreshAndAuthority = <T extends { timestamp?: string; source: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const scoreA = scoreItem(a.timestamp ?? "", a.source);
    const scoreB = scoreItem(b.timestamp ?? "", b.source);
    return scoreB - scoreA;
  });
};

const sortRiverByFreshAndAuthority = <T extends { source: string }>(items: T[], timestamps: string[]): T[] => {
  return items
    .map((item, index) => ({
      item,
      score: scoreItem(timestamps[index] ?? "", item.source)
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};

// Some responses still include stray text; attempt to recover the JSON block.
const tryParseJson = (rawText: string): NewsFeed => {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed) as NewsFeed;
  } catch (error) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as NewsFeed;
    }
    throw error;
  }
};

export const fetchNewsForTopic = async (topic: string): Promise<NewsFeed> => {
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY in environment.");
  }

  const primaryCounts = { topStories: 6, riverOfNews: 12, quickLinks: 7, trendingTopics: 5 };
  const fallbackCounts = { topStories: 5, riverOfNews: 10, quickLinks: 6, trendingTopics: 4 };

  try {
    const outputText = await requestNews(topic, primaryCounts, 4000);
    const parsed = tryParseJson(outputText);
    return {
      ...parsed,
      topStories: sortByFreshAndAuthority(parsed.topStories),
      riverOfNews: sortRiverByFreshAndAuthority(parsed.riverOfNews, parsed.topStories.map((s) => s.timestamp))
    };
  } catch (error) {
    const outputText = await requestNews(topic, fallbackCounts, 2200);
    const parsed = tryParseJson(outputText);
    return {
      ...parsed,
      topStories: sortByFreshAndAuthority(parsed.topStories),
      riverOfNews: sortRiverByFreshAndAuthority(parsed.riverOfNews, parsed.topStories.map((s) => s.timestamp))
    };
  }
};
