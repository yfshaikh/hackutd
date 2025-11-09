// import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, X } from 'lucide-react'
import { LaTeXRenderer } from '@/components/utils/latex-renderer'
import { InlineSATQuestion } from '@/components/chatbot/tools/inline-sat-question'
import type { Question } from '@/types/question'

interface QuestionComparisonModalProps {
  sampleQuestion: any // The sample question from config
  generatedQuestion: Partial<Question> // The generated question data
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionComparisonModal({
  sampleQuestion,
  generatedQuestion,
  isOpen,
  onOpenChange
}: QuestionComparisonModalProps) {
  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Question Comparison & Editing
          </h2>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sample Question Side */}
          <div className="w-1/2 p-4 border-r flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">Sample Question</Badge>
              <Badge variant="outline" className="text-xs">Reference</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="space-y-4">
                {/* Sample Question Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  {sampleQuestion.type && (
                    <Badge className="text-xs bg-blue-100 text-blue-800">
                      {sampleQuestion.type}
                    </Badge>
                  )}
                  {sampleQuestion.difficulty && (
                    <Badge className={`text-xs ${
                      sampleQuestion.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      sampleQuestion.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sampleQuestion.difficulty}
                    </Badge>
                  )}
                  {sampleQuestion.topic_name && (
                    <Badge className="text-xs bg-purple-100 text-purple-800">
                      {sampleQuestion.topic_name}
                    </Badge>
                  )}
                </div>

                {/* Sample Question Content */}
                <div className="space-y-3">
                  {/* Question Text */}
                  <div className="p-3 rounded-lg border bg-muted/20">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Question:</div>
                    <div className="text-sm">
                      <LaTeXRenderer 
                        text={sampleQuestion.question} 
                        hasLatex={sampleQuestion.has_latex}
                      />
                    </div>
                  </div>

                  {/* Answer Choices */}
                  {sampleQuestion.choices && (
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Answer Choices:</div>
                      <div className="space-y-2">
                        {sampleQuestion.choices.map((choice: string, index: number) => (
                          <div key={index} className={`text-sm p-2 rounded ${
                            sampleQuestion.correct_answer === String.fromCharCode(65 + index) ||
                            sampleQuestion.correct_answer === choice
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-background'
                          }`}>
                            <span className="font-semibold text-blue-600">
                              {String.fromCharCode(65 + index)}.
                            </span>{' '}
                            <LaTeXRenderer 
                              text={choice} 
                              hasLatex={sampleQuestion.has_latex}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer (FRQ) */}
                  {sampleQuestion.correct_answer && !sampleQuestion.choices && (
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</div>
                      <div className="text-sm bg-green-50 p-2 rounded">
                        <LaTeXRenderer 
                          text={sampleQuestion.correct_answer} 
                          hasLatex={sampleQuestion.has_latex}
                        />
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {sampleQuestion.explanation && (
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Explanation:</div>
                      <div className="text-sm bg-blue-50 p-2 rounded">
                        <LaTeXRenderer 
                          text={sampleQuestion.explanation} 
                          hasLatex={sampleQuestion.has_latex}
                        />
                      </div>
                    </div>
                  )}

                  {/* Hints */}
                  {sampleQuestion.hints && sampleQuestion.hints.length > 0 && (
                    <div className="p-3 rounded-lg border bg-muted/20">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Hints:</div>
                      <div className="space-y-2">
                        {sampleQuestion.hints.map((hint: string, index: number) => (
                          <div key={index} className="text-sm bg-yellow-50 p-2 rounded">
                            <span className="font-medium text-yellow-700">Hint {index + 1}:</span>{' '}
                            <LaTeXRenderer 
                              text={hint} 
                              hasLatex={sampleQuestion.hints_has_latex}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Question Side */}
          <div className="w-1/2 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Generated Question</Badge>
                <Badge variant="outline" className="text-xs">Editable</Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <InlineSATQuestion 
                data={generatedQuestion}
                title="Generated Question"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
} 