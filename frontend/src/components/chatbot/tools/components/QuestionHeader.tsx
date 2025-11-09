import { CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit3, 
  X, 
  BookOpen, 
  Save,
  RotateCcw,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Question } from '@/types/question'

type SATQuestionData = Partial<Omit<Question, 'id'>>

interface QuestionHeaderProps {
  title: string
  data: SATQuestionData
  isEditing: boolean
  hasChanges: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onReset: () => void
  onSaveToDb?: () => void
  isSavingToDb?: boolean
}

export function QuestionHeader({
  title,
  data,
  isEditing,
  hasChanges,
  onEdit,
  onSave,
  onCancel,
  onReset,
  onSaveToDb,
  isSavingToDb = false
}: QuestionHeaderProps) {
  const difficultyColors = {
    Easy: 'bg-success/10 text-success-foreground border-success/20',
    Medium: 'bg-warning/10 text-warning-foreground border-warning/20',
    Hard: 'bg-destructive/10 text-destructive-foreground border-destructive/20'
  }

  const typeColors = {
    MCQ: 'bg-info/10 text-info-foreground border-info/20',
    FRQ: 'bg-primary/10 text-primary-foreground border-primary/20'
  }

  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {data.topic_name && (
                <Badge variant="secondary" className="text-xs">
                  MATH
                </Badge>
              )}
              {data.type && (
                <Badge className={cn("text-xs border", typeColors[data.type])}>
                  {data.type === 'MCQ' ? 'Multiple Choice' : 'Free Response'}
                </Badge>
              )}
              {data.difficulty && (
                <Badge className={cn("text-xs border", difficultyColors[data.difficulty])}>
                  {data.difficulty}
                </Badge>
              )}
              {data.has_diagram && (
                <Badge variant="outline" className="text-xs">
                  📊 Has Diagram
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              {hasChanges && (
                <Button size="sm" variant="outline" onClick={onReset} className="h-8">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onCancel} className="h-8">
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} className="h-8" disabled={!hasChanges}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={onEdit} className="h-8">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {onSaveToDb && (
            <Button 
              size="sm" 
              onClick={onSaveToDb} 
              className="h-8 bg-green-600 hover:bg-green-700 text-white"
              disabled={isSavingToDb}
            >
              <Database className="h-3 w-3 mr-1" />
              {isSavingToDb ? 'Saving...' : 'Save to DB'}
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
  )
} 