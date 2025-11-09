import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Target, Plus, X } from 'lucide-react'
import { LaTeXRenderer } from '@/components/utils/latex-renderer'
import type { Question } from '@/types/question'

type SATQuestionData = Partial<Omit<Question, 'id'>>

interface HintsSectionProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onAddHint: () => void
  onRemoveHint: (index: number) => void
  onUpdateHint: (index: number, value: string) => void
}

export function HintsSection({
  data,
  isEditing,
  editedData,
  onAddHint,
  onRemoveHint,
  onUpdateHint
}: HintsSectionProps) {
  const currentData = isEditing ? editedData || data : data

  if (!currentData.hints?.length && !isEditing) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-semibold text-foreground">
            Hints
          </label>
        </div>
        {isEditing && (
          <Button size="sm" variant="outline" onClick={onAddHint} className="h-6 px-2">
            <Plus className="h-3 w-3 mr-1" />
            Add Hint
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {isEditing ? (
          <>
            {(editedData?.hints || []).map((hint, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <Textarea
                    value={hint}
                    onChange={(e) => onUpdateHint(index, e.target.value)}
                    placeholder={`Enter hint ${index + 1}...`}
                    className="min-h-[60px] resize-none"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveHint(index)}
                  className="h-8 w-8 p-0 mt-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </>
        ) : (
          currentData.hints?.map((hint, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium mt-0.5">
                {index + 1}
              </div>
              <div className="flex-1 text-sm p-2 rounded-md border bg-primary/5 border-primary/20">
                <LaTeXRenderer 
                  text={hint} 
                  hasLatex={currentData.has_latex} 
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 