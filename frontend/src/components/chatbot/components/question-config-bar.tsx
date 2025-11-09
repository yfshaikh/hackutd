import { useState } from "react"
import { ChevronDown, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { LaTeXRenderer } from "@/components/utils/latex-renderer"
import type { SATQuestionGenerateRequest } from '@/data/sat-questions'

interface QuestionConfigBarProps {
  config: SATQuestionGenerateRequest
}

export function QuestionConfigBar({ config }: QuestionConfigBarProps) {
  const [isQuestionConfigExpanded, setIsQuestionConfigExpanded] = useState(false)

  return (
    <div className="mt-3 transition-all duration-200">
      {/* Subtle Toggle Button */}
      <button
        onClick={() => setIsQuestionConfigExpanded(!isQuestionConfigExpanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <span>show config</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform duration-200",
          isQuestionConfigExpanded ? "rotate-180" : "rotate-0"
        )} />
      </button>

      {/* Expanded Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isQuestionConfigExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="mt-3 p-3 rounded-lg border bg-muted/30 border-border max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* Configuration Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Topic
                </div>
                <div className="text-sm text-foreground">
                  {config.topic}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Subtopic
                </div>
                <div className="text-sm text-foreground">
                  {config.subtopic}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Difficulty
                </div>
                <div className="text-sm capitalize text-foreground">
                  {config.difficulty}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Subject
                </div>
                <div className="text-sm uppercase text-foreground">
                  {config.subject}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">
                  Type
                </div>
                <div className="text-sm uppercase text-foreground">
                  {config.type}
                </div>
              </div>
            </div>
            
            {/* Sample Question */}
            {config.sample_question && (
              <div className="pt-3 border-t border-border">
                <div className="text-xs font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  Sample Question Reference
                </div>
                
                <div className="p-3 rounded-lg text-sm bg-muted/50 border border-border space-y-3 w-full max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {/* Question Header Info */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(config.sample_question as any).type && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {(config.sample_question as any).type}
                      </span>
                    )}
                    {(config.sample_question as any).difficulty && (
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        (config.sample_question as any).difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        (config.sample_question as any).difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(config.sample_question as any).difficulty}
                      </span>
                    )}
                    {(config.sample_question as any).topic_name && (
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        {(config.sample_question as any).topic_name}
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="font-medium text-foreground break-words whitespace-pre-wrap">
                    <LaTeXRenderer 
                      text={config.sample_question.question} 
                      hasLatex={(config.sample_question as any).has_latex}
                    />
                  </div>
                  
                  {/* Answer Choices */}
                  {config.sample_question.choices && (
                    <div className="space-y-1.5">
                      {config.sample_question.choices.map((choice, index) => (
                        <div key={index} className={`text-sm p-2 rounded break-words ${
                          (config.sample_question as any).correct_answer === String.fromCharCode(65 + index) ||
                          (config.sample_question as any).correct_answer === choice
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'text-muted-foreground'
                        }`}>
                          <span className="font-semibold text-info">
                            {String.fromCharCode(65 + index)}.
                          </span>{' '}
                          <span className="break-words">
                            <LaTeXRenderer 
                              text={choice} 
                              hasLatex={(config.sample_question as any).has_latex}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answer (if no choices or FRQ) */}
                  {(config.sample_question as any).correct_answer && !config.sample_question.choices && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Correct Answer:</div>
                      <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                        <LaTeXRenderer 
                          text={(config.sample_question as any).correct_answer} 
                          hasLatex={(config.sample_question as any).has_latex}
                        />
                      </div>
                    </div>
                  )}

                  {/* Explanation/Rationale */}
                  {(config.sample_question as any).explanation && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Explanation:</div>
                      <div className="text-sm text-foreground bg-blue-50 p-2 rounded">
                        <LaTeXRenderer 
                          text={(config.sample_question as any).explanation} 
                          hasLatex={(config.sample_question as any).has_latex}
                        />
                      </div>
                    </div>
                  )}

                  {/* Hints */}
                  {(config.sample_question as any).hints && (config.sample_question as any).hints.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Hints:</div>
                      <div className="space-y-1">
                        {(config.sample_question as any).hints.map((hint: string, index: number) => (
                          <div key={index} className="text-sm text-foreground bg-yellow-50 p-2 rounded">
                            <span className="font-medium text-yellow-700">Hint {index + 1}:</span>{' '}
                            <LaTeXRenderer 
                              text={hint} 
                              hasLatex={(config.sample_question as any).hints_has_latex}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {(config.sample_question as any).tags && (config.sample_question as any).tags.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {(config.sample_question as any).tags.map((tag: string, index: number) => (
                          <span key={index} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IRT Parameters */}
                  {((config.sample_question as any).irt_difficulty !== undefined || 
                    (config.sample_question as any).irt_discrimination !== undefined || 
                    (config.sample_question as any).irt_guessing !== undefined) && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">IRT Parameters:</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {(config.sample_question as any).irt_difficulty !== undefined && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium">Difficulty</div>
                            <div>{(config.sample_question as any).irt_difficulty.toFixed(3)}</div>
                          </div>
                        )}
                        {(config.sample_question as any).irt_discrimination !== undefined && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium">Discrimination</div>
                            <div>{(config.sample_question as any).irt_discrimination.toFixed(3)}</div>
                          </div>
                        )}
                        {(config.sample_question as any).irt_guessing !== undefined && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium">Guessing</div>
                            <div>{(config.sample_question as any).irt_guessing.toFixed(3)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Desmos Method */}
                  {(config.sample_question as any).desmos_method && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Desmos Method:</div>
                      <div className="text-sm text-foreground bg-blue-50 p-2 rounded">
                        <LaTeXRenderer 
                          text={(config.sample_question as any).desmos_method} 
                          hasLatex={(config.sample_question as any).has_latex}
                        />
                      </div>
                    </div>
                  )}

                  {/* Desmos Solution Indicator */}
                  {(config.sample_question as any).desmos_solution && (
                    <div className="pt-2 border-t border-border">
                      <div className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <span>📊</span> Has Desmos Solution
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 