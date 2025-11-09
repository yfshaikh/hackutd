import type React from "react"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles } from "lucide-react"
import { ContentTypeSelector } from "@/components/archive/sidebar/content-type-selector"

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  selectedContentType: string
  onContentTypeChange: (type: string) => void
  isLoading: boolean
  showContentTypeSelector?: boolean
  customPlaceholder?: string
  additionalTools?: React.ReactNode[]
  leftSideTools?: React.ReactNode[]
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  selectedContentType,
  onContentTypeChange,
  isLoading,
  showContentTypeSelector = true,
  customPlaceholder = "Type a message... (Shift + Enter for new line)",
  additionalTools = [],
  leftSideTools = [],
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`
    }
  }, [input])

  // const inputClass = "flex-1 bg-slate-100/80 border border-slate-200/50 text-slate-800 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 py-4 px-4 text-lg rounded-2xl transition-all duration-300 focus:bg-slate-200/60"
  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Horizontal Layout Container */}
        <div className="flex items-center gap-2">
          {/* Content Type Selector Container */}
          {showContentTypeSelector && (
            <div className="w-fit">
              <div className="p-2">
                <ContentTypeSelector
                  selectedType={selectedContentType}
                  onTypeChange={onContentTypeChange}
                  className="w-32 bg-muted/80 border border-border text-foreground text-lg py-4 px-4 h-14 rounded-2xl transition-all duration-300 hover:bg-muted"
                />
              </div>
            </div>
          )}

          {/* Input Container */}
          <div className="flex-1">
            <div className="flex items-center gap-2 p-2">
              {/* Left Side Tools */}
              {leftSideTools.length > 0 && (
                <div className="flex items-center gap-2">
                  {leftSideTools.map((tool, index) => (
                    <div key={index}>{tool}</div>
                  ))}
                </div>
              )}

              {/* Message Input Form */}
              <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={customPlaceholder}
                      className="min-h-[56px] max-h-32 resize-none flex-1 h-14 py-4 px-4 bg-input border border-border text-foreground placeholder:text-muted-foreground text-lg rounded-2xl transition-all duration-300 focus-visible:ring-0 focus-visible:ring-offset-0  focus-visible:ring-ring"
                      disabled={isLoading}
                      rows={1}
                    />
                  </div>
                  
                  {/* Additional Tools */}
                  {additionalTools.length > 0 && (
                    <div className="flex items-center gap-2">
                      {additionalTools.map((tool, index) => (
                        <div key={index}>{tool}</div>
                      ))}
                    </div>
                  )}
                  
                  {/* Send Button */}
                  <Button
                    type="submit"
                    size="sm"
                    className="h-14 w-14 p-0 rounded-2xl shrink-0 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? (
                      <Sparkles className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform duration-200" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 