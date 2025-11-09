/**
 * Chat Message - Individual message rendering with special formatting
 * 
 * This component handles the display of different message types:
 * - User messages with SAT question configuration displays
 * - Assistant messages with tool invocations and generated content
 * - Proper LaTeX rendering and interactive components
 * - Tool result display through ToolInvocation components
 * 
 * Message Type Detection:
 * - isUser && message.satConfig → shows QuestionConfigBar
 * - isAssistant && toolInvocations → shows ToolInvocation (SAT questions, etc.)
 * - Handles tool results merged from conversation history
 * 
 * Data Flow:
 * - Receives messages reconstructed from ChatInterface
 * - Passes tool results to ToolInvocation for proper rendering
 * - Displays SAT configs through QuestionConfigBar component
 */

// import type React from "react"
import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, User, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { ToolInvocation } from "@/components/chatbot/tools/tool-invocation"
import type { SATQuestionGenerateRequest } from '@/data/sat-questions'
import type { Question } from '@/types/question'
import { LaTeXRenderer } from "@/components/utils/latex-renderer"
import { QuestionComparisonModal } from "./question-comparison-modal"
import { QuestionConfigBar } from "./question-config-bar"
import { useQuestionConfig } from "@/context/question-config-context"
 
interface ChatMessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system" | "data" | "tool"
    content: string
    createdAt?: Date
    parts?: Array<{ type: string }>
    toolInvocations?: Array<{
      toolName: string
      toolCallId: string
      state: "partial-call" | "call" | "result" | "error"
      result?: any
    }>
    satConfig?: SATQuestionGenerateRequest // Optional SAT question generation config embedded in message
    // Additional fields from stored messages
    tool_calls?: any[]
    tool_call_id?: string
    tool_name?: string
    metadata?: Record<string, any>
    message_index?: number
  }
  onDynamicContentGenerated?: (content: any) => void
}

export function ChatMessage({ message, onDynamicContentGenerated }: ChatMessageProps) {
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)
  
  // Get question config from context for comparison functionality
  const { config: contextConfig, includeSampleQuestion } = useQuestionConfig()
  
  // Extract the actual generated question from tool invocations
  const getGeneratedQuestion = (): Partial<Question> | null => {
    if (!message.toolInvocations) return null
    
    // Find SAT question generation tool invocation
    const satQuestionInvocation = message.toolInvocations.find(
      invocation => 
        (invocation.toolName === "generate_question" || invocation.toolName === "generate_sat_question") &&
        invocation.state === "result" &&
        invocation.result
    )
    
    return satQuestionInvocation?.result || null
  }
  
  const generatedQuestion = getGeneratedQuestion()
  
  // Use embedded satConfig from message (for user messages) or context config (for assistant messages)
  const satConfig = message.satConfig || (
    includeSampleQuestion && contextConfig.sampleQuestion ? {
      subject: contextConfig.subject,
      type: contextConfig.type,
      topic: contextConfig.topic,
      subtopic: contextConfig.subtopic,
      difficulty: contextConfig.difficulty,
      sample_question: contextConfig.sampleQuestion,
      user_message: undefined
    } : undefined
  )
  
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }



  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  
  // Check if this message has successful tool invocations (indicating content generation)
  // const hasGeneratedContent = message.toolInvocations && message.toolInvocations.some(tool => tool.state === "result")

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}>
      {isAssistant && (
        <div className="shrink-0 relative">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className={cn(
              "text-xs",
              isUser 
                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
                : "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground"
            )}>
              <Bot className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "order-first" : ""} relative`}>
        {/* Message Bubble */}
        <Card className={cn(
          "relative rounded-3xl transition-all duration-200",
          isUser
            ? "bg-primary/5 border-primary/20"
            : "bg-card border-border"
        )}>
          <CardContent className="px-3 py-0 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="flex flex-col gap-3 w-full min-w-0">
              {message.content && (
                <div className="relative">
                  <p className={cn(
                    "leading-relaxed transition-colors duration-300 text-base break-words whitespace-pre-wrap",
                  )}>
                    <LaTeXRenderer text={message.content} />
                  </p>
                </div>
              )}

              {/* Question Config Display for user messages */}
              {isUser && satConfig && (
                <QuestionConfigBar config={satConfig} />
              )}

              {/* Tool Invocations */}
              {message.parts && message.parts.some(part => part.type === 'tool-invocation') && (
                <div className="flex flex-col gap-4 mt-2">
                  {message.toolInvocations?.map((toolInvocation) => (
                    <div key={toolInvocation.toolCallId}>
                      <ToolInvocation toolInvocation={toolInvocation} onDynamicContentGenerated={onDynamicContentGenerated} />
                      {/* Add comparison button for generated SAT questions */}
                      {(toolInvocation.toolName === "generate_question" || toolInvocation.toolName === "generate_sat_question") &&
                       toolInvocation.state === "result" && 
                       satConfig?.sample_question && (
                        <div className="mt-3 flex justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsComparisonModalOpen(true)}
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            Compare with Sample Question
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )} 
            </div>
          </CardContent>
        </Card>
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-1 transition-opacity duration-300 opacity-60 group-hover:opacity-100",
          isUser ? "text-right text-primary" : "text-left text-muted-foreground"
        )}>
          {message.createdAt ? formatTime(new Date(message.createdAt)) : formatTime(new Date())}
        </div>
      </div>

      {isUser && (
        <div className="shrink-0 relative">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Question Comparison Modal */}
      {satConfig?.sample_question && generatedQuestion && (
        <QuestionComparisonModal
          sampleQuestion={satConfig.sample_question}
          generatedQuestion={generatedQuestion}
          isOpen={isComparisonModalOpen}
          onOpenChange={setIsComparisonModalOpen}
        />
      )}
    </div>
  )
} 