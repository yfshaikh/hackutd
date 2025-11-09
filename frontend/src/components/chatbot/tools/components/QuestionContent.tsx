import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LaTeXRenderer } from '@/components/utils/latex-renderer'
import type { Question } from '@/types/question'

type SATQuestionData = Partial<Omit<Question, 'id'>>

interface QuestionContentProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onUpdateField: (field: keyof SATQuestionData, value: any) => void
  onUpdateChoice: (index: number, value: string) => void
}

export function QuestionContent({
  data,
  isEditing,
  editedData,
  onUpdateField,
  onUpdateChoice
}: QuestionContentProps) {
  const currentData = isEditing ? editedData || data : data

  return (
    <>
      {/* Diagram Information */}
      {currentData.has_diagram && (
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <span className="text-sm font-medium text-foreground">
              📊 Diagram Required
            </span>
            {currentData.diagram_url && (
              <div className="text-sm p-2 rounded-md border bg-info/5 border-info/20">
                {typeof currentData.diagram_url === 'string' ? (
                  <span className="text-foreground">{currentData.diagram_url}</span>
                ) : (
                  currentData.diagram_url
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-semibold text-foreground">
            Question
          </label>
        </div>
        
        {isEditing ? (
          <Textarea
            value={currentData.question || ''}
            onChange={(e) => onUpdateField('question', e.target.value)}
            placeholder="Enter the question text..."
            className="min-h-[100px] resize-none"
          />
        ) : (
          <div className="text-sm leading-relaxed p-3 rounded-md border bg-muted/30 min-h-[100px]">
            {currentData.question ? (
              <LaTeXRenderer 
                text={currentData.question} 
                hasLatex={currentData.has_latex} 
              />
            ) : (
              'No question text provided'
            )}
          </div>
        )}
      </div>

      {/* Answer Choices (for MCQ) */}
      {currentData.type === 'MCQ' && currentData.choices && currentData.choices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-semibold text-foreground">
              Answer Choices
            </label>
          </div>
          
          <div className="space-y-2">
            {currentData.choices.map((choice, index) => {
              // Extract the letter and choice text (e.g., "A. Choice text" -> "A" and "Choice text")
              const choiceLetter = String.fromCharCode(65 + index)
              const choiceText = choice.replace(/^[A-D]\.\s*/, '')
              const isCorrect = currentData.correct_answer === choiceLetter
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold border",
                    isCorrect
                      ? "bg-success/10 text-success-foreground border-success"
                      : "bg-muted text-muted-foreground border-border"
                  )}>
                    {choiceLetter}
                  </div>
                  
                  {isEditing ? (
                    <Input
                      value={choiceText}
                      onChange={(e) => onUpdateChoice(index, `${choiceLetter}. ${e.target.value}`)}
                      className="flex-1"
                    />
                  ) : (
                    <div className="flex-1 text-sm p-2 rounded-md border bg-muted/20">
                      <LaTeXRenderer 
                        text={choiceText} 
                        hasLatex={currentData.has_latex} 
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Correct Answer (for FRQ) */}
      {currentData.type === 'FRQ' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-success" />
            <label className="text-sm font-semibold text-foreground">
              Correct Answer
            </label>
          </div>
          
          {isEditing ? (
            <Textarea
              value={currentData.correct_answer || ''}
              onChange={(e) => onUpdateField('correct_answer', e.target.value)}
              placeholder="Enter the correct answer..."
              className="min-h-[80px] resize-none"
            />
          ) : (
            <div className="text-sm leading-relaxed p-3 rounded-md border bg-success/5 border-success/20 text-success-foreground">
              {currentData.correct_answer ? (
                <LaTeXRenderer 
                  text={currentData.correct_answer} 
                  hasLatex={currentData.has_latex} 
                />
              ) : (
                'No answer provided'
              )}
            </div>
          )}
        </div>
      )}

      <hr className="border-border" />

      {/* Explanation/Rationale */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-semibold text-foreground">
            Explanation
          </label>
        </div>
        
        {isEditing ? (
          <Textarea
            value={currentData.explanation || ''}
            onChange={(e) => onUpdateField('explanation', e.target.value)}
            placeholder="Enter the explanation for this question..."
            className="min-h-[100px] resize-none"
          />
        ) : (
          <div className="text-sm leading-relaxed min-h-[100px] p-3 rounded-md border bg-info/5 border-info/20 text-info-foreground">
            {currentData.explanation ? (
              <LaTeXRenderer 
                text={currentData.explanation} 
                hasLatex={currentData.has_latex} 
              />
            ) : (
              'No explanation provided'
            )}
          </div>
        )}
      </div>
    </>
  )
} 