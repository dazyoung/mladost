// Claude API client for browser-side NPC dog conversations
// Uses Anthropic Messages API directly with user-provided API key
// Falls back to template-based responses when no key is available

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 150;
const STORAGE_KEY = 'mladost_api_key';

export class LLMClient {
  constructor() {
    this.apiKey = localStorage.getItem(STORAGE_KEY) || '';
  }

  get isConfigured() {
    return this.apiKey.length > 0;
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem(STORAGE_KEY, this.apiKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getApiKey() {
    return this.apiKey;
  }

  // Build a system prompt that defines the dog's character
  buildSystemPrompt(npcDog) {
    const personalityTraits = {
      friendly: 'extremely friendly, warm, enthusiastic, and welcoming. You love everyone you meet and show it with excitement.',
      shy: 'very shy, timid, and soft-spoken. You warm up slowly, use lots of "..." and hesitation. You\'re sweet once comfortable.',
      adventurous: 'bold, daring, and always talking about your latest adventure. You\'re restless and love exploring new places.',
      wise: 'calm, thoughtful, and philosophical. You speak with measured words and often share deep observations about life.',
      playful: 'hyperactive, silly, and everything is a game to you. You can barely contain your excitement and energy.',
      grumpy: 'grumpy, sarcastic, and curmudgeonly — but with a hidden heart of gold. You complain about everything but secretly care.',
    };

    const skillDescriptions = {
      guide: 'You know every path, meadow, pond, and landmark in Mladost. You give directions and describe interesting places to visit.',
      storyteller: 'You know all the legends and tales of Mladost. You love weaving stories about the land, the Great Pack, the golden bone, and the history of the village.',
      forager: 'You\'re an expert at finding food, bones, berries, and hidden treasures. You share tips about where to find things.',
      guard: 'You patrol and protect the village. You talk about safety, keeping watch, and your patrol routes.',
      comedian: 'You\'re always cracking jokes, puns (especially dog puns), and trying to make everyone laugh.',
    };

    return `You are ${npcDog.name}, a ${npcDog.breed} dog living in Mladost, a peaceful village with meadows, a winding river, ponds, flower patches, and forest clearings.

PERSONALITY: You are ${personalityTraits[npcDog.personality] || personalityTraits.friendly}

SKILL: ${skillDescriptions[npcDog.skill] || skillDescriptions.guide}

WORLD CONTEXT:
- Mladost is a serene village with paths, a river crossed by a bridge, flower meadows, berry bushes, and scattered trees
- There are bones hidden around the meadows for dogs to find
- A legendary golden bone is said to be hidden where the flowers bloom thickest
- Butterflies flutter around the flower patches
- There's a cozy dog house and a cottage in the village
- The river runs north to south through the middle, with a bridge on the main east-west path

RULES:
- You ARE a dog. You think, act, and speak as a dog would (but one that can talk)
- Keep responses SHORT (1-3 sentences max). This is game dialogue, not an essay
- Use dog mannerisms: *wags tail*, *sniffs*, *tilts head*, *barks*, etc.
- Stay in character at ALL times
- If asked about things outside the game world, respond as your character would — confused, dismissive, or curious
- Never break character or acknowledge you're an AI
- Don't use emojis, use *asterisk actions* instead`;
  }

  // Send a message and get a response from Claude
  async sendMessage(npcDog, playerMessage, conversationHistory = []) {
    if (!this.isConfigured) {
      return null; // Caller should use template fallback
    }

    // Build messages array from conversation history
    const messages = [];

    // Include recent history (last 10 exchanges) for context
    const recentHistory = conversationHistory.slice(-20);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.from === 'player' ? 'user' : 'assistant',
        content: msg.text,
      });
    }

    // Add current player message
    messages.push({
      role: 'user',
      content: playerMessage,
    });

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: this.buildSystemPrompt(npcDog),
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.warn('Claude API error:', response.status, error);

        if (response.status === 401) {
          // Bad API key
          return { error: 'invalid_key', text: null };
        }
        if (response.status === 429) {
          return { error: 'rate_limit', text: null };
        }
        return { error: 'api_error', text: null };
      }

      const data = await response.json();
      const text = data.content?.[0]?.text?.trim();
      return { error: null, text: text || '*tilts head in confusion*' };
    } catch (err) {
      console.warn('Claude API fetch error:', err);
      return { error: 'network', text: null };
    }
  }
}
