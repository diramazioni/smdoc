export type LettaRole = 'user' | 'assistant';

export interface LettaMessage {
  role: LettaRole;
  content: string;
}

export type LettaSyncAction = 'created' | 'updated' | 'deleted';
export type LettaFileType = 'markdown' | 'pdf' | 'image';

export interface LettaSyncMetadata {
  title?: string;
  slug?: string;
  description?: string;
}

export interface LettaChatRequest {
  message: string;
  projectId?: string;
  userId: string;
}

export interface LettaSyncRequest {
  projectId: string;
  slug: string;
  action: LettaSyncAction;
  metadata?: LettaSyncMetadata;
}
