import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import type { Question } from '@/types/question'

type SATQuestionData = Partial<Omit<Question, 'id'>>

interface IRTParametersProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onUpdateField: (field: keyof SATQuestionData, value: any) => void
}

export function IRTParameters({
  data,
  isEditing,
  editedData,
  onUpdateField
}: IRTParametersProps) {
  const currentData = isEditing ? editedData || data : data

  const hasAnyIRTParams = currentData.irt_difficulty !== undefined || 
                         currentData.irt_discrimination !== undefined || 
                         currentData.irt_guessing !== undefined

  if (!hasAnyIRTParams && !isEditing) {
    return null
  }

  return (
    <div className="flex items-start gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <span className="text-sm font-medium text-foreground">
          Item Response Theory Parameters
        </span>
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <Label className="text-xs">Difficulty (-3 to +3)</Label>
              <Input
                type="number"
                step="0.1"
                min="-3"
                max="3"
                value={editedData?.irt_difficulty || 0}
                onChange={(e) => onUpdateField('irt_difficulty', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Discrimination (0.5 to 2.5)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="2.5"
                value={editedData?.irt_discrimination || 1}
                onChange={(e) => onUpdateField('irt_discrimination', parseFloat(e.target.value) || 1)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Guessing (0.0 to 0.3)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="0.3"
                value={editedData?.irt_guessing || 0}
                onChange={(e) => onUpdateField('irt_guessing', parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {currentData.irt_difficulty !== undefined && (
              <div className="p-2 rounded-md border bg-muted/20">
                <span className="font-medium text-muted-foreground block">Difficulty:</span>
                <span className="text-foreground">{currentData.irt_difficulty.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground block">(-3 easy → +3 hard)</span>
              </div>
            )}
            {currentData.irt_discrimination !== undefined && (
              <div className="p-2 rounded-md border bg-muted/20">
                <span className="font-medium text-muted-foreground block">Discrimination:</span>
                <span className="text-foreground">{currentData.irt_discrimination.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground block">(0.5 → 2.5)</span>
              </div>
            )}
            {currentData.irt_guessing !== undefined && (
              <div className="p-2 rounded-md border bg-muted/20">
                <span className="font-medium text-muted-foreground block">Guessing:</span>
                <span className="text-foreground">{currentData.irt_guessing.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground block">(0.0 → 0.3)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 