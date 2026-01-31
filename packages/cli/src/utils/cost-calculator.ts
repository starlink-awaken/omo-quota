import { getPricing } from '../pricing';
import type { MessageData } from './message-parser';

export interface CostCalculation {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  promptCost: number;
  completionCost: number;
  cacheCost: number;
  totalCost: number;
}

export function calculateCost(message: MessageData): CostCalculation {
  const pricing = getPricing(message.providerID, message.modelID);
  
  const promptTokens = message.tokens.input || 0;
  const completionTokens = message.tokens.output || 0;
  const cacheReadTokens = message.tokens.cache?.read || 0;
  const cacheWriteTokens = message.tokens.cache?.write || 0;
  
  let promptCost = 0;
  let completionCost = 0;
  let cacheCost = 0;
  
  if (pricing) {
    promptCost = promptTokens * pricing.prompt;
    completionCost = completionTokens * pricing.completion;
    
    if (pricing.cacheRead && pricing.cacheWrite) {
      cacheCost = (cacheReadTokens * pricing.cacheRead) + (cacheWriteTokens * pricing.cacheWrite);
    }
  }
  
  return {
    provider: message.providerID,
    model: message.modelID,
    promptTokens,
    completionTokens,
    cacheReadTokens,
    cacheWriteTokens,
    promptCost,
    completionCost,
    cacheCost,
    totalCost: promptCost + completionCost + cacheCost,
  };
}

export interface AggregatedCost {
  totalCost: number;
  byProvider: Map<string, number>;
  byModel: Map<string, number>;
  totalTokens: number;
}

export function aggregateCosts(calculations: CostCalculation[]): AggregatedCost {
  const byProvider = new Map<string, number>();
  const byModel = new Map<string, number>();
  let totalCost = 0;
  let totalTokens = 0;
  
  for (const calc of calculations) {
    totalCost += calc.totalCost;
    totalTokens += calc.promptTokens + calc.completionTokens;
    
    byProvider.set(
      calc.provider,
      (byProvider.get(calc.provider) || 0) + calc.totalCost
    );
    
    const modelKey = `${calc.provider}/${calc.model}`;
    byModel.set(
      modelKey,
      (byModel.get(modelKey) || 0) + calc.totalCost
    );
  }
  
  return {
    totalCost,
    byProvider,
    byModel,
    totalTokens,
  };
}
