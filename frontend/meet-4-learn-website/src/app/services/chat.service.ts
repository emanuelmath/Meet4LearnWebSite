import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: number;
  moduleId: number;
  senderId: string;
  messageText: string;
  time: string;
  senderName?: string;
  senderAvatar?: string;
  isMine?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private supabaseService: SupabaseService, private authService: AuthService) {}

  private realtimeChannel: RealtimeChannel | null = null;
  
  currentMessages = signal<ChatMessage[]>([]);

  async loadMessages(moduleId: number) {
    const myId = this.authService.getCurrentUserId();

    const { data, error } = await this.supabaseService.client
      .from('chat_messages')
      .select(`
        *,
        sender: senderId ( full_name )
      `)
      .eq('moduleId', moduleId)
      .order('time', { ascending: true });

    if (error) {
      console.error('Error cargando chats:', error);
      return;
    }

    const mapped = data.map((msg: any) => ({
      ...msg,
      isMine: msg.senderId === myId,
      senderName: msg.sender?.full_name || 'Usuario',
      senderAvatar: null 
    }));

    this.currentMessages.set(mapped);
  }

  subscribeToChat(moduleId: number) {
    this.unsubscribe();

    const myId = this.authService.getCurrentUserId();

    this.realtimeChannel = this.supabaseService.client
      .channel(`chat-room-${moduleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `moduleId=eq.${moduleId}`
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          const { data } = await this.supabaseService.client
             .from('profile')
             .select('full_name')
             .eq('id', newMsg.senderId)
             .single();

          const formattedMsg: ChatMessage = {
            ...newMsg,
            isMine: newMsg.senderId === myId,
            senderName: data?.full_name || 'Desconocido'
          };

          this.currentMessages.update(msgs => [...msgs, formattedMsg]);
        }
      )
      .subscribe();
  }

  async sendMessage(moduleId: number, text: string) {
    const myId = this.authService.getCurrentUserId();
    if (!myId || !text.trim()) return;

    const { error } = await this.supabaseService.client
      .from('chat_messages')
      .insert({
        moduleId: moduleId,
        senderId: myId,
        messageText: text,
        time: new Date().toISOString()
      });

    if (error) console.error('Error enviando mensaje:', error);
  }

  unsubscribe() {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}