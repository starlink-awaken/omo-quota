export interface MessageData {
  id: string;
  providerID: string;
  modelID: string;
  tokens: {
    input: number;
    output: number;
    reasoning?: number;
    cache?: {
      read: number;
      write: number;
    };
  };
  time: {
    created: number;
    completed?: number;
  };
}

export async function parseMessage(filePath: string): Promise<MessageData | null> {
  try {
    const file = Bun.file(filePath);
    const content = await file.json();
    
    if (content.role !== 'assistant' || !content.tokens) {
      return null;
    }
    
    return {
      id: content.id,
      providerID: content.providerID || 'unknown',
      modelID: content.modelID || 'unknown',
      tokens: {
        input: content.tokens.input || 0,
        output: content.tokens.output || 0,
        reasoning: content.tokens.reasoning,
        cache: content.tokens.cache
      },
      time: {
        created: content.time?.created || Date.now(),
        completed: content.time?.completed
      }
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

export async function scanSessionDirectory(sessionDir: string): Promise<MessageData[]> {
  const messages: MessageData[] = [];
  
  try {
    const glob = new Bun.Glob('msg_*.json');
    const files = Array.from(glob.scanSync(sessionDir));
    
    for (const file of files) {
      const fullPath = `${sessionDir}/${file}`;
      const data = await parseMessage(fullPath);
      if (data) {
        messages.push(data);
      }
    }
  } catch (error) {
    console.error(`Failed to scan session directory ${sessionDir}:`, error);
  }
  
  return messages;
}

export async function scanAllSessions(storageDir: string): Promise<MessageData[]> {
  const allMessages: MessageData[] = [];
  
  try {
    const glob = new Bun.Glob('ses_*');
    const sessions = Array.from(glob.scanSync(storageDir));
    
    for (const session of sessions) {
      const sessionPath = `${storageDir}/${session}`;
      const messages = await scanSessionDirectory(sessionPath);
      allMessages.push(...messages);
    }
  } catch (error) {
    console.error(`Failed to scan storage directory ${storageDir}:`, error);
  }
  
  return allMessages;
}

export const DEFAULT_STORAGE_PATH = `${process.env.HOME}/.local/share/opencode/storage/message`;
