export interface ModelPricing {
  prompt: number;
  completion: number;
  cacheRead?: number;
  cacheWrite?: number;
}

export interface ProviderPricing {
  [model: string]: ModelPricing;
}

export const PRICING_TABLE: Record<string, ProviderPricing> = {
  'openai': {
    'gpt-4': {
      prompt: 0.03 / 1000,
      completion: 0.06 / 1000,
    },
    'gpt-4-turbo': {
      prompt: 0.01 / 1000,
      completion: 0.03 / 1000,
    },
    'gpt-4o': {
      prompt: 0.005 / 1000,
      completion: 0.015 / 1000,
    },
    'gpt-4o-mini': {
      prompt: 0.00015 / 1000,
      completion: 0.0006 / 1000,
    },
    'gpt-3.5-turbo': {
      prompt: 0.0005 / 1000,
      completion: 0.0015 / 1000,
    },
  },
  'anthropic': {
    'claude-opus-4': {
      prompt: 0.015 / 1000,
      completion: 0.075 / 1000,
      cacheRead: 0.0015 / 1000,
      cacheWrite: 0.01875 / 1000,
    },
    'claude-sonnet-4': {
      prompt: 0.003 / 1000,
      completion: 0.015 / 1000,
      cacheRead: 0.0003 / 1000,
      cacheWrite: 0.00375 / 1000,
    },
    'claude-sonnet-3-5': {
      prompt: 0.003 / 1000,
      completion: 0.015 / 1000,
      cacheRead: 0.0003 / 1000,
      cacheWrite: 0.00375 / 1000,
    },
    'claude-haiku-3-5': {
      prompt: 0.001 / 1000,
      completion: 0.005 / 1000,
      cacheRead: 0.0001 / 1000,
      cacheWrite: 0.00125 / 1000,
    },
  },
  'google': {
    'gemini-2.0-flash-exp': {
      prompt: 0,
      completion: 0,
    },
    'gemini-2.0-flash-thinking-exp': {
      prompt: 0,
      completion: 0,
    },
    'gemini-1.5-pro': {
      prompt: 0.00125 / 1000,
      completion: 0.005 / 1000,
      cacheRead: 0.0003125 / 1000,
    },
    'gemini-1.5-flash': {
      prompt: 0.000075 / 1000,
      completion: 0.0003 / 1000,
      cacheRead: 0.00001875 / 1000,
    },
  },
  'zhipuai': {
    'glm-4-plus': {
      prompt: 0.05 / 1000,
      completion: 0.05 / 1000,
    },
    'glm-4-air': {
      prompt: 0.001 / 1000,
      completion: 0.001 / 1000,
    },
    'glm-4-airx': {
      prompt: 0.01 / 1000,
      completion: 0.01 / 1000,
    },
    'glm-4-flash': {
      prompt: 0.0001 / 1000,
      completion: 0.0001 / 1000,
    },
  },
  'github-copilot': {
    'gpt-4o': {
      prompt: 0,
      completion: 0,
    },
    'gpt-4o-mini': {
      prompt: 0,
      completion: 0,
    },
    'o1-preview': {
      prompt: 0,
      completion: 0,
    },
    'o1-mini': {
      prompt: 0,
      completion: 0,
    },
  },
  'deepseek': {
    'deepseek-chat': {
      prompt: 0.0014 / 1000,
      completion: 0.0028 / 1000,
      cacheRead: 0.00014 / 1000,
    },
    'deepseek-reasoner': {
      prompt: 0.0055 / 1000,
      completion: 0.0055 / 1000,
      cacheRead: 0.00014 / 1000,
    },
  },
};

export function getPricing(provider: string, model: string): ModelPricing | null {
  const providerKey = provider.toLowerCase().split('-')[0];
  const modelKey = model.toLowerCase();
  
  const providerPricing = PRICING_TABLE[providerKey];
  if (!providerPricing) {
    return null;
  }
  
  for (const [key, pricing] of Object.entries(providerPricing)) {
    if (modelKey.includes(key) || key.includes(modelKey)) {
      return pricing;
    }
  }
  
  return null;
}
