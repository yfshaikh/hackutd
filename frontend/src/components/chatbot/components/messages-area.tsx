/**
 * MessagesArea - Main chat messages display area
 * 
 * This component handles:
 * - Display of all chat messages with proper formatting
 * - Loading states for conversation history
 * - Authentication prompts for anonymous users
 * - Message rendering with SAT configs and tool invocations
 * - Typing indicator during AI responses
 * - Auto-scrolling to latest messages
 */

import React from 'react'
import { ChatMessage } from './chat-message'
import { TypingIndicator } from './typing-indicator'
import { AuthenticationRequired } from './authentication-required'

interface Message {
  id: string
  role: "user" | "assistant" | "system" | "data"
  content: string
  createdAt?: Date
  parts?: Array<{ type: string }>
  toolInvocations?: Array<{
    toolName: string
    toolCallId: string
    state: "partial-call" | "call" | "result" | "error"
    result?: any
  }>
  satConfig?: any
}

interface MessagesAreaProps {
  messages: Message[]
  isLoading: boolean
  isLoadingHistory: boolean
  showContent: boolean
  messagesWithSatConfig: Set<number>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  session: any
  onDynamicContentGenerated?: (content: any) => void
}

export function MessagesArea({
  messages,
  isLoading,
  isLoadingHistory,
  showContent,
  messagesWithSatConfig,
  messagesEndRef,
  session,
  onDynamicContentGenerated
}: MessagesAreaProps) {
  return (
    <div className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0 transition-all duration-700 ${
      showContent ? "pr-2 sm:pr-4" : "pr-4 sm:pr-6"
    }`}>
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Loading state for conversation history */}
        {isLoadingHistory && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading conversation...</div>
          </div>
        )}
        
        {/* Authentication required message */}
        {!session && <AuthenticationRequired />}
        
        {messages.map((message, index) => {
          // Check if this message should have satConfig
          const shouldShowSatConfig = messagesWithSatConfig.has(index)
          
          // Clean the message content and embed satConfig if it has one
          let processedMessage = { ...message }
          
          if (shouldShowSatConfig && message.role === "user") {
            // Extract satConfig and clean content
            const configPattern = /\n\n\[SAT Question Generation Config: (.*?)\]$/s
            const contentTypePattern = /\n\n\[Preferred content type: .*?\]/s
            
            const match = message.content.match(configPattern)
            
            if (match) {
              try {
                const satConfig = JSON.parse(match[1])
                let cleanContent = message.content
                  .replace(configPattern, '')
                  .replace(contentTypePattern, '')
                  .trim()
                
                processedMessage = {
                  ...message,
                  content: cleanContent,
                  satConfig: satConfig
                } as any
              } catch (error) {
                console.error('Failed to parse satConfig:', error)
              }
            }
          }
          
          return (
            <div 
              key={message.id} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ChatMessage 
                message={processedMessage} 
                onDynamicContentGenerated={onDynamicContentGenerated}
              /> 
            </div>
          )
        })}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="animate-fade-in-up">
            <TypingIndicator />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
} 