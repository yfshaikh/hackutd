/**
 * ConversationSidebar - Left sidebar for conversation management
 * 
 * This component handles:
 * - List of user's conversations with metadata
 * - Create new conversation functionality
 * - Delete conversation functionality
 * - Conversation selection and switching
 * - Loading states and empty states
 */

import React from 'react'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ChatConversation } from '@/lib/api/chat'

interface ConversationSidebarProps {
  conversations: ChatConversation[]
  currentConversationId?: string
  isLoadingConversations: boolean
  onSelectConversation: (conversationId: string) => void
  onCreateConversation: () => void
  onDeleteConversation: (conversationId: string, event: React.MouseEvent) => void
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  isLoadingConversations,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  return (
    <div className="w-80 border-r border-border bg-card/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Conversations</h3>
          <Button
            onClick={onCreateConversation}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="p-4">
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Start a new conversation to begin</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-all duration-200 hover:bg-muted/50 group ${
                  currentConversationId === conversation.id ? 'bg-primary/10 border-primary/20' : ''
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {conversation.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {conversation.last_message_preview || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{conversation.message_count || 0} messages</span>
                        {conversation.updated_at && (
                          <span>• {new Date(conversation.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => onDeleteConversation(conversation.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 