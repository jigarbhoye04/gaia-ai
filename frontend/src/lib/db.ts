import Dexie, { Table } from 'dexie';
import { Conversation } from '@/features/chat/api/chatApi';
import { MessageType } from '@/types/features/convoTypes';

export interface ConversationWithMessages {
  id: string;
  title: string;
  messages: MessageType[];
}

export class MySubClassedDexie extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<MessageType>;

  constructor() {
    super('gaia-ai-chat');
    this.version(1).stores({
      conversations: '++id, &conversation_id, starred, is_system_generated, system_purpose, createdAt, updatedAt',
      messages: '++id, &message_id, conversation_id, type, response, created_at, model, liked, disliked, pin_order',
    });
  }
}

export const db = new MySubClassedDexie();
