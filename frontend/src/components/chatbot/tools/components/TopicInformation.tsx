import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, X } from 'lucide-react'
import type { Question } from '@/types/question'

type SATQuestionData = Partial<Omit<Question, 'id'>>

interface TopicInformationProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onAddTag: () => void
  onRemoveTag: (index: number) => void
  onUpdateTag: (index: number, value: string) => void
}

export function TopicInformation({
  data,
  isEditing,
  editedData,
  onAddTag,
  onRemoveTag,
  onUpdateTag
}: TopicInformationProps) {
  const currentData = isEditing ? editedData || data : data

  if (!currentData.topic_name && !currentData.subtopic_name && !currentData.tags?.length && !isEditing) {
    return null
  }

  return (
    <div className="flex items-start gap-2">
      <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <span className="text-sm font-medium text-foreground">
          Learning Objectives
        </span>
        <div className="text-sm space-y-1">
          {currentData.topic_name && (
            <div>
              <span className="font-medium mr-2 text-muted-foreground">
                Topic:
              </span>
              <span className="text-foreground">
                {currentData.topic_name}
              </span>
            </div>
          )}
          {currentData.subtopic_name && (
            <div>
              <span className="font-medium mr-2 text-muted-foreground">
                Subtopic:
              </span>
              <span className="text-foreground">
                {currentData.subtopic_name}
              </span>
            </div>
          )}
          {((currentData.tags && currentData.tags.length > 0) || isEditing) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-muted-foreground">
                  Tags:
                </span>
                {isEditing && (
                  <Button size="sm" variant="outline" onClick={onAddTag} className="h-6 px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {isEditing ? (
                  <>
                    {(editedData?.tags || []).map((tag, index) => (
                      <div key={index} className="flex items-center gap-1 bg-muted p-1 rounded">
                        <Input
                          value={tag}
                          onChange={(e) => onUpdateTag(index, e.target.value)}
                          className="h-6 px-1 text-xs min-w-[60px] w-auto"
                          placeholder="Tag"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRemoveTag(index)}
                          className="h-5 w-5 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </>
                ) : (
                  currentData.tags?.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 