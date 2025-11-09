/**
 * Chat Interface - Main chat component with conversation management
 * 
 * This component provides a complete chat interface with:
 * - Persistent conversation history stored in Supabase
 * - Conversation sidebar with create/switch/delete functionality
 * - Message reconstruction from database with proper formatting
 * - Authentication integration and user data isolation
 * - Tool result parsing and display
 * 
 * Key Features:
 * - Loads conversation history and reconstructs message format
 * - Extracts SAT configs from user messages for proper display
 * - Merges tool results with assistant messages for inline rendering
 * - Handles authentication and graceful degradation for anonymous users
 * 
 * Usage:
 *   <ChatInterface 
 *     conversationId={id}
 *     onConversationChange={handleChange}
 *     showConversationList={true}
 *     config={chatConfig}
 *   />
 */

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChatInput } from "./chat-input"
import { DynamicContentPanel } from "@/pages/chatbot/dynamic-ui/component/dynamic-content-panel"
import { ConversationSidebar } from "./conversation-sidebar"
import { AdditionalToolsBar } from "./additional-tools-bar"
import { MessagesArea } from "./messages-area"
import { useChat } from '@ai-sdk/react'
import { Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { SATQuestionGenerateRequest } from '@/data/sat-questions'
import { useQuestionConfig } from "@/context/question-config-context"
import { useAuth } from "@/context/auth-context"
import { 
  getConversations, 
  getConversationHistory, 
  createConversation, 
  deleteConversation,
  type ChatConversation 
} from "@/lib/api/chat"
 
// Configuration interface for different chat modes
export interface ChatConfig {
  apiEndpoint: string
  initialMessage?: string
  showContentTypeSelector?: boolean
  additionalTools?: React.ReactNode[]
  additionalInputTools?: React.ReactNode[]
  leftSideInputTools?: React.ReactNode[]
  onMessageComplete?: (message: any) => void
  customInputPlaceholder?: string
  allowDynamicContent?: boolean
  questionGenerateRequest?: SATQuestionGenerateRequest // SAT question generation config data
}

interface ChatInterfaceProps {
  selectedContentType?: string
  onContentTypeChange?: (type: string) => void
  showContent?: boolean
  config?: ChatConfig
  conversationId?: string
  onConversationChange?: (conversationId: string) => void
  showConversationList?: boolean
  // onContentGenerated?: (content: any) => void
}

// Default configuration
const defaultConfig: ChatConfig = {
  apiEndpoint: "http://localhost:8000/chat/message",
  initialMessage: "Hello! I'm your AI tutor. I can help you learn by creating interactive content like flashcards, quizzes, concept maps, and more. What would you like to study today?",
  showContentTypeSelector: true,
  customInputPlaceholder: "Type a message... (Shift + Enter for new line)",
  allowDynamicContent: true
}

export function ChatInterface({
  selectedContentType = "auto",
  onContentTypeChange,
  showContent = false,
  config = defaultConfig,
  conversationId: initialConversationId,
  onConversationChange,
  showConversationList = true,
  // onContentGenerated, 
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { session } = useAuth()
  
  // Merge provided config with defaults
  const chatConfig = { ...defaultConfig, ...config }
  
  // Get question config from context
  const { createQuestionGenerateRequest, includeSampleQuestion } = useQuestionConfig()
  
  // State for dynamic content panel
  const [showDynamicPanel, setShowDynamicPanel] = useState(false)
  const [dynamicContent, setDynamicContent] = useState<any>(null)
  const [lastGeneratedContent, setLastGeneratedContent] = useState<any>(null)
  
  // Track which message indices should have satConfig
  const [messagesWithSatConfig, setMessagesWithSatConfig] = useState<Set<number>>(new Set())
  
  // Conversation management state
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(initialConversationId)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const { messages, input, setInput, append, isLoading, setMessages } = useChat({
    api: chatConfig.apiEndpoint,
    headers: session ? {
      'Authorization': `Bearer ${session.access_token}`,
    } : {},
    body: {
      conversation_id: currentConversationId,
      save_to_history: true,
    },
    initialMessages: chatConfig.initialMessage ? [
      {
        id: "1",
        role: "assistant",
        content: chatConfig.initialMessage,
      }
    ] : [],
    onFinish: (message) => {
      // Note: Response headers are not available in useChat onFinish callback
      // The conversation ID will be managed through the backend body parameters
      
      // Check if the response contains content generation data
      try {
        // const contentData = JSON.parse(message.content)
        // if (contentData.contentType && onContentGenerated) {
        //   onContentGenerated(contentData)
        // }
      } catch {
        // Not JSON content, regular message
      }
      
      // Call custom completion handler if provided
      if (chatConfig.onMessageComplete) {
        chatConfig.onMessageComplete(message)
      }
      
      // Refresh conversations list after new message
      if (session && showConversationList) {
        loadConversations()
      }
    },
  })

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!session || !showConversationList) return
    
    setIsLoadingConversations(true)
    try {
      const response = await getConversations(session.access_token)
      setConversations(response.conversations)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [session, showConversationList])

  // Load conversation history
  const loadConversationHistory = useCallback(async (conversationId: string) => {
    if (!session) return

    setIsLoadingHistory(true)
    try {
      const response = await getConversationHistory(session.access_token, conversationId)
      
      // Group messages to properly reconstruct tool invocations
      const processedMessages = []
      const messages = response.messages.sort((a, b) => a.message_index - b.message_index)
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        
        const baseMessage = {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content || "",
          createdAt: new Date(msg.created_at)
        }

        // Handle user messages - extract SAT config from content
        if (msg.role === "user" && msg.content) {
          const configPattern = /\n\n\[SAT Question Generation Config: (.*?)\]$/s
          const contentTypePattern = /\n\n\[Preferred content type: .*?\]/s
          
          const match = msg.content.match(configPattern)
          if (match) {
            try {
              const satConfig = JSON.parse(match[1])
              let cleanContent = msg.content
                .replace(configPattern, '')
                .replace(contentTypePattern, '')
                .trim()
              
              processedMessages.push({
                ...baseMessage,
                content: cleanContent,
                satConfig: satConfig
              })
              continue
            } catch (error) {
              console.error('Failed to parse satConfig from history:', error)
            }
          }
          
          processedMessages.push(baseMessage)
          continue
        }

        // Handle assistant messages - reconstruct tool invocations with results
        if (msg.role === "assistant") {
          let toolInvocations: Array<{
            toolName: string
            toolCallId: string
            state: "partial-call" | "call" | "result" | "error"
            result?: any
          }> = []
          
          // If this message has tool_calls, process them
          if (msg.tool_calls) {
            try {
              toolInvocations = msg.tool_calls.map(tc => {
                // Find the corresponding tool result message
                const toolResultMsg = messages.find(m => 
                  m.role === "tool" && 
                  m.tool_call_id === tc.id &&
                  m.message_index > msg.message_index
                )
                
                let result = undefined
                if (toolResultMsg && toolResultMsg.content) {
                  try {
                    // Tool results are stored as JSON strings in the database
                    result = JSON.parse(toolResultMsg.content)
                  } catch (parseError) {
                    console.warn('Failed to parse tool result JSON:', parseError, 'Content:', toolResultMsg.content)
                    result = toolResultMsg.content
                  }
                }
                
                // Tool invocation reconstructed successfully

                return {
                  toolName: tc.function?.name || "",
                  toolCallId: tc.id || "",
                  state: "result" as const,
                  result: result
                }
              })
            } catch (error) {
              console.error('Failed to parse tool calls from history:', error)
            }
          }
          
          if (toolInvocations.length > 0) {
            processedMessages.push({
              ...baseMessage,
              toolInvocations,
              parts: [{ type: 'tool-invocation' }]
            })
          } else {
            processedMessages.push(baseMessage)
          }
          continue
        }

        // Skip tool result messages as they're already processed with their assistant messages
        if (msg.role === "tool") {
          continue
        }

        // Handle other message types
        processedMessages.push(baseMessage)
      }
      
      setMessages(processedMessages as any[])
    } catch (error) {
      console.error('Failed to load conversation history:', error)
      // Show error message to user
      setMessages([{
        id: "error",
        role: "assistant",
        content: "Sorry, I couldn't load the conversation history. Please try refreshing the page.",
        createdAt: new Date()
      }])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [session, setMessages])

  // Create new conversation
  const handleCreateConversation = useCallback(async () => {
    if (!session) return

    try {
      const response = await createConversation(session.access_token)
      setCurrentConversationId(response.conversation_id)
      onConversationChange?.(response.conversation_id)
      setMessages([])
      
      // Add initial message if configured
      if (chatConfig.initialMessage) {
        setMessages([{
          id: "1",
          role: "assistant",
          content: chatConfig.initialMessage,
        }])
      }
      
      await loadConversations()
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }, [session, onConversationChange, setMessages, chatConfig.initialMessage, loadConversations])

  // Switch to a conversation
  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    onConversationChange?.(conversationId)
    await loadConversationHistory(conversationId)
  }, [onConversationChange, loadConversationHistory])

  // Delete conversation
  const handleDeleteConversation = useCallback(async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!session) return

    try {
      await deleteConversation(session.access_token, conversationId)
      await loadConversations()
      
      // If we deleted the current conversation, create a new one
      if (conversationId === currentConversationId) {
        await handleCreateConversation()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }, [session, currentConversationId, loadConversations, handleCreateConversation])

  // Function to handle dynamic content generation
  const handleDynamicContentGenerated = useCallback((content: any) => {
    if (chatConfig.allowDynamicContent) {
      // Skip sidepanel for SAT questions since they're displayed inline now
      if (content.contentType === 'sat_question') {
        return
      }
      
      setDynamicContent(content)
      setLastGeneratedContent(content) // Store for later reopen
      setShowDynamicPanel(true)
    }
  }, [chatConfig.allowDynamicContent])

  const closeDynamicPanel = useCallback(() => {
    setShowDynamicPanel(false)
    setDynamicContent(null)
  }, [])

  const reopenDynamicPanel = useCallback(() => {
    if (lastGeneratedContent) {
      setDynamicContent(lastGeneratedContent)
      setShowDynamicPanel(true)
    }
  }, [lastGeneratedContent])

  const saveDynamicContent = useCallback(() => {
    if (!dynamicContent) return
    // Toast notification would go here
    console.log(`${dynamicContent.title} has been saved to your library.`)
  }, [dynamicContent])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load conversations on mount and when session changes
  useEffect(() => {
    if (session && showConversationList) {
      loadConversations()
    }
  }, [session, showConversationList, loadConversations])

  // Load conversation history if conversation ID is provided
  useEffect(() => {
    if (currentConversationId && session) {
      loadConversationHistory(currentConversationId)
    }
  }, [currentConversationId, session, loadConversationHistory])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Get the current question generate request from context
    const questionGenerateRequest = createQuestionGenerateRequest()
    
    // Track if this message will have satConfig
    const willHaveSatConfig = !!(questionGenerateRequest && includeSampleQuestion)
    
    // The next user message will be at the current messages length (after append)
    const nextMessageIndex = messages.length
    
    if (willHaveSatConfig) {
      setMessagesWithSatConfig(prev => new Set([...prev, nextMessageIndex]))
    }

    // Build message content with optional metadata
    let messageContent = input

    // Include content type preference if selector is enabled
    if (chatConfig.showContentTypeSelector) {
      messageContent += `\n\n[Preferred content type: ${selectedContentType}]`
    }

    // Include SAT question generation request if available and user wants it included
    if (willHaveSatConfig) {
      messageContent += `\n\n[SAT Question Generation Config: ${JSON.stringify(questionGenerateRequest)}]`
    }

    append({
      content: messageContent, // Send full content with config to backend
      role: "user" as const,
    })
    setInput("")
  }

  return (
    <div className="flex h-full bg-background relative">
      {/* Conversation Sidebar */}
      {showConversationList && session && (
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          isLoadingConversations={isLoadingConversations}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      )}

      {/* Main Chat Container */}
      <div className={`flex flex-col transition-all duration-700 ease-in-out ${showDynamicPanel ? 'flex-1 lg:w-1/2' : 'flex-1'}`}>
        {/* Additional Tools Bar */}
        <AdditionalToolsBar tools={chatConfig.additionalTools || []} />

        {/* Messages Area */}
        <MessagesArea
          messages={messages}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          showContent={showContent}
          messagesWithSatConfig={messagesWithSatConfig}
          messagesEndRef={messagesEndRef}
          session={session}
          onDynamicContentGenerated={handleDynamicContentGenerated}
        />

        {/* Input Area */}
        <div className="flex-shrink-0 mt-2 sm:mt-4">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={handleSendMessage}
            selectedContentType={selectedContentType}
            onContentTypeChange={onContentTypeChange || (() => {})}
            isLoading={isLoading}
            showContentTypeSelector={chatConfig.showContentTypeSelector}
            customPlaceholder={chatConfig.customInputPlaceholder}
            additionalTools={chatConfig.additionalInputTools}
            leftSideTools={chatConfig.leftSideInputTools}
          />
        </div>
      </div>

      {/* Dynamic Content Panel - Slides in from right */}
      {chatConfig.allowDynamicContent && (
        <DynamicContentPanel
          isOpen={showDynamicPanel}
          content={dynamicContent}
          onClose={closeDynamicPanel}
          onSave={saveDynamicContent}
        />
      )}
      
      {/* Floating button to reopen panel with last content */}
      {chatConfig.allowDynamicContent && lastGeneratedContent && !showDynamicPanel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={reopenDynamicPanel}
                className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-full p-4 shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-110"
                size="icon"
              >
                <Layers className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-popover text-popover-foreground border-border">
              <p>Reopen last generated content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// Export the original interface for backward compatibility  
export function OriginalChatInterface(props: Omit<ChatInterfaceProps, 'config'>) {
  return <ChatInterface {...props} />
}

// Export types for external use
export type { SATQuestionGenerateRequest } from '@/data/sat-questions' 