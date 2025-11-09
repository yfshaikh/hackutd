import { useEffect } from "react"
import { Loader2, CheckCircle2, Brain, BookOpen, Map } from "lucide-react"
import { cn } from "@/lib/utils"
import { Weather } from "./weather"
import { InlineSATQuestion } from "./inline-sat-question"

interface ToolInvocationProps {
  toolInvocation: {
    toolName: string
    toolCallId: string
    state: "partial-call" | "call" | "result" | "error"
    result?: any
  }
  onDynamicContentGenerated?: (content: any) => void
} 



export function ToolInvocation({ toolInvocation, onDynamicContentGenerated }: ToolInvocationProps) {
  const { toolName, toolCallId, state } = toolInvocation

  // Handle dynamic content generation (excluding SAT questions which are displayed inline)
  useEffect(() => {
    if (state === "result" && toolInvocation.result && onDynamicContentGenerated) {
      const { result } = toolInvocation
      
      if (toolName === "get_questions") {
        onDynamicContentGenerated({
          contentType: "quiz",
          title: "Generated Quiz",
          data: result
        })
      } else if (toolName === "generate_flashcards") {
        onDynamicContentGenerated({
          contentType: "flashcards", 
          title: "Generated Flashcards",
          data: result
        })
      } else if (toolName === "generate_concept_map") {
        onDynamicContentGenerated({
          contentType: "graph",
          title: "Generated Concept Map", 
          data: result
        })
      }
      // Note: SAT questions are now displayed inline, not in sidepanel
    }
  }, [state, toolCallId, onDynamicContentGenerated, toolName])

  if (state === "result") {
    const { result } = toolInvocation

    // Handle special weather tool
    if (toolName === "get_current_weather") {
      return <Weather weatherAtLocation={result} />
    }

    // Handle SAT question generation - display inline
    if (toolName === "generate_question" || toolName === "generate_sat_question") {
      // Result should always be a JSON object from the backend
      const title = result?.crew_generated ? "AI Crew Generated Question" : "Generated SAT Question"
      return <InlineSATQuestion data={result} title={title} />
    }

    // Handle content generation tools - show a modern success state
    if (toolName === "get_questions" || toolName === "generate_flashcards" || toolName === "generate_concept_map") {
      const getToolConfig = () => {
        switch (toolName) {
          case "get_questions":
            return {
              icon: Brain,
              label: "Quiz Generated",
              description: "Interactive quiz ready to practice",
              color: "text-blue-600",
              bgColor: "bg-blue-50",
              borderColor: "border-blue-200"
            }
          case "generate_flashcards":
            return {
              icon: BookOpen,
              label: "Flashcards Generated", 
              description: "Study cards ready for review",
              color: "text-purple-600",
              bgColor: "bg-purple-50",
              borderColor: "border-purple-200"
            }
          case "generate_concept_map":
            return {
              icon: Map,
              label: "Concept Map Generated",
              description: "Visual learning map available",
              color: "text-green-600", 
              bgColor: "bg-green-50",
              borderColor: "border-green-200"
            }
          default:
            return {
              icon: CheckCircle2,
              label: "Tool Completed",
              description: "Task finished successfully",
              color: "text-gray-600",
              bgColor: "bg-gray-50",
              borderColor: "border-gray-200"
            }
        }
      }

      const config = getToolConfig()
      const IconComponent = config.icon

      return (
        <div className={cn(
          "inline-flex items-center gap-3 px-4 py-3 rounded-xl border",
          config.bgColor,
          config.borderColor,
          "shadow-sm transition-all duration-200"
        )}>
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            config.bgColor.replace('50', '100'),
            config.color
          )}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-sm font-medium", config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">
              {config.description}
            </span>
          </div>
        </div>
      )
    }

    // Fallback for other tools - cleaner JSON display
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {toolName.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  // Modern loading state
  return (
    <div className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-blue-700">
          {toolName.replace(/_/g, ' ')}
        </span>
        <span className="text-xs text-blue-500">
          Processing...
        </span>
      </div>
    </div>
  )
}