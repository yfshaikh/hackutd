import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { Question, DesmosSolution } from '@/types/question'
import { questionsApi, type CreateQuestionData } from '@/lib/api/questions'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'

// Import all the new sub-components
import { QuestionHeader } from './components/QuestionHeader'
import { TopicInformation } from './components/TopicInformation'
import { IRTParameters } from './components/IRTParameters'
import { HintsSection } from './components/HintsSection'
import { QuestionContent } from './components/QuestionContent'
import { DesmosSection } from './components/DesmosSection'

type ExpressionType = 'equation' | 'point' | 'slider' | 'table' | 'regression' | 'inequality'
type SATQuestionData = Partial<Omit<Question, 'id'>>

interface InlineSATQuestionProps {
  data: SATQuestionData
  title: string
}

export function InlineSATQuestion({ data, title }: InlineSATQuestionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [localData, setLocalData] = useState<SATQuestionData>(data)
  const [editedData, setEditedData] = useState<SATQuestionData>(data)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSavingToDb, setIsSavingToDb] = useState(false)
  
  const { session } = useAuth()

  // Update local data when prop changes (in case parent updates the data)
  useEffect(() => {
    setLocalData(data)
    setEditedData(data)
  }, [data])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData({ ...localData })
    setHasChanges(false)
  }

  const handleSave = () => {
    // Update local data to reflect the saved changes
    setLocalData(editedData)
    setIsEditing(false)
    setHasChanges(false)
    // Here you could add actual save functionality to update the question in the database
    console.log('Saving question changes:', editedData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({ ...localData })
    setHasChanges(false)
  }

  const handleReset = () => {
    setEditedData({ ...localData })
    setHasChanges(false)
  }

  const updateField = useCallback((field: keyof SATQuestionData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  const updateChoice = useCallback((index: number, value: string) => {
    setEditedData(prev => ({
      ...prev,
      choices: prev.choices?.map((choice, i) => i === index ? value : choice) || []
    }))
    setHasChanges(true)
  }, [])

  // Helper functions for editing arrays
  const addTag = () => {
    const currentTags = editedData.tags || []
    updateField('tags', [...currentTags, ''])
  }

  const removeTag = (index: number) => {
    const currentTags = editedData.tags || []
    updateField('tags', currentTags.filter((_, i) => i !== index))
  }

  const updateTag = (index: number, value: string) => {
    const currentTags = editedData.tags || []
    updateField('tags', currentTags.map((tag, i) => i === index ? value : tag))
  }

  const addHint = () => {
    const currentHints = editedData.hints || []
    updateField('hints', [...currentHints, ''])
  }

  const removeHint = (index: number) => {
    const currentHints = editedData.hints || []
    updateField('hints', currentHints.filter((_, i) => i !== index))
  }

  const updateHint = (index: number, value: string) => {
    const currentHints = editedData.hints || []
    updateField('hints', currentHints.map((hint, i) => i === index ? value : hint))
  }

  // Desmos solution helpers
  const initializeDesmosSolution = () => {
    const defaultSolution: DesmosSolution = {
      expressions: [],
      viewport: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 }
    }
    updateField('desmos_solution', defaultSolution)
  }

  const updateDesmosSolution = (solution: DesmosSolution) => {
    updateField('desmos_solution', solution)
  }

  // Desmos expression management
  const getIdPrefix = (type: ExpressionType): string => {
    switch (type) {
      case 'equation': return 'eq_'
      case 'point': return 'pt_'
      case 'slider': return 'slider_'
      case 'table': return 'table_'
      case 'regression': return 'reg_'
      case 'inequality': return 'ineq_'
      default: return 'expr_'
    }
  }

  const addDesmosExpression = (type: ExpressionType = 'equation') => {
    if (!editedData.desmos_solution) return
    
    const prefix = getIdPrefix(type)
    const newExpression: any = {
      id: `${prefix}${Date.now()}`,
      latex: '',
      color: 'blue',
      type: type as string
    }

    // Add type-specific properties
    if (type === 'equation') {
      newExpression.lineStyle = 'solid'
    } else if (type === 'point') {
      newExpression.pointStyle = 'open'
    } else if (type === 'slider') {
      newExpression.slider = {
        min: 0,
        max: 10,
        step: 1,
        playing: false
      }
    } else if (type === 'table') {
      newExpression.table = {
        columns: [
          { id: 'x_1', values: [] },
          { id: 'y_1', values: [] }
        ]
      }
    } else if (type === 'regression') {
      newExpression.regression = {
        regressionType: 'linear',
        independentVariable: 'x_1',
        dependentVariable: 'y_1'
      }
    }

    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    newSolution.expressions = [...newSolution.expressions, newExpression]
    updateDesmosSolution(newSolution)
  }

  const removeDesmosExpression = (index: number) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    newSolution.expressions = newSolution.expressions.filter((_: any, i: number) => i !== index)
    updateDesmosSolution(newSolution)
  }

  const updateDesmosExpression = (index: number, field: string, value: any) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    const newExpressions = [...newSolution.expressions]
    newExpressions[index] = { 
      ...newExpressions[index], 
      [field]: value
    }
    
    // Update ID prefix when type changes
    if (field === 'type') {
      const prefix = getIdPrefix(value as ExpressionType)
      const currentId = newExpressions[index].id
      const timestamp = currentId.split('_').pop() || Date.now().toString()
      newExpressions[index].id = `${prefix}${timestamp}`

      // Add/remove type-specific properties
      if (value === 'slider') {
        newExpressions[index].slider = {
          min: 0,
          max: 10,
          step: 1,
          playing: false
        }
        delete newExpressions[index].lineStyle
        delete newExpressions[index].pointStyle
        delete newExpressions[index].table
        delete newExpressions[index].regression
      } else if (value === 'equation') {
        newExpressions[index].lineStyle = 'solid'
        delete newExpressions[index].pointStyle
        delete newExpressions[index].slider
        delete newExpressions[index].table
        delete newExpressions[index].regression
      } else if (value === 'point') {
        newExpressions[index].pointStyle = 'open'
        delete newExpressions[index].lineStyle
        delete newExpressions[index].slider
        delete newExpressions[index].table
        delete newExpressions[index].regression
      } else if (value === 'table') {
        newExpressions[index].table = {
          columns: [
            { id: 'x_1', values: [] },
            { id: 'y_1', values: [] } 
          ]
        }
        delete newExpressions[index].lineStyle
        delete newExpressions[index].pointStyle
        delete newExpressions[index].slider
        delete newExpressions[index].regression
      } else if (value === 'regression') {
        newExpressions[index].regression = {
          regressionType: 'linear',
          independentVariable: 'x_1',
          dependentVariable: 'y_1'
        }
        delete newExpressions[index].lineStyle
        delete newExpressions[index].pointStyle
        delete newExpressions[index].slider
        delete newExpressions[index].table
      }
    }

    newSolution.expressions = newExpressions
    updateDesmosSolution(newSolution)
  }

  const updateDesmosSlider = (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['slider']>, value: number | boolean) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    const newExpressions = [...newSolution.expressions]
    if (newExpressions[index].slider) {
      newExpressions[index].slider = { 
        ...newExpressions[index].slider!, 
        [field]: value 
      }
      newSolution.expressions = newExpressions
      updateDesmosSolution(newSolution)
    }
  }

  const updateDesmosTable = (index: number, columnIndex: number, field: string, value: any) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    const newExpressions = [...newSolution.expressions]
    if (newExpressions[index].table) {
      const newColumns = [...newExpressions[index].table!.columns]
      newColumns[columnIndex] = { ...newColumns[columnIndex], [field]: value }
      newExpressions[index].table = { ...newExpressions[index].table!, columns: newColumns }
      newSolution.expressions = newExpressions
      updateDesmosSolution(newSolution)
    }
  }

  const addDesmosTableColumn = (index: number) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    const newExpressions = [...newSolution.expressions]
    if (newExpressions[index].table) {
      const columnCount = newExpressions[index].table!.columns.length
      newExpressions[index].table!.columns.push({
        id: `col_${columnCount + 1}`,
        values: []
      })
      newSolution.expressions = newExpressions
      updateDesmosSolution(newSolution)
    }
  }

  const removeDesmosTableColumn = (index: number, columnIndex: number) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    const newExpressions = [...newSolution.expressions]
    if (newExpressions[index].table && newExpressions[index].table!.columns.length > 2) {
      newExpressions[index].table!.columns.splice(columnIndex, 1)
      newSolution.expressions = newExpressions
      updateDesmosSolution(newSolution)
    }
  }

  const updateDesmosTableValues = (index: number, columnIndex: number, values: string) => {
    const parsedValues = values.split(',').map(v => {
      const trimmed = v.trim()
      const num = Number(trimmed)
      return isNaN(num) ? trimmed : num
    }).filter(v => v !== '')
    
    updateDesmosTable(index, columnIndex, 'values', parsedValues)
  }

  const updateDesmosRegression = (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['regression']>, value: string) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    const newExpressions = [...newSolution.expressions]
    if (newExpressions[index].regression) {
      newExpressions[index].regression = { 
        ...newExpressions[index].regression!, 
        [field]: value 
      }
      newSolution.expressions = newExpressions
      updateDesmosSolution(newSolution)
    }
  }

  const updateDesmosViewport = (field: keyof DesmosSolution['viewport'], value: number) => {
    if (!editedData.desmos_solution) return
    
    const solution = editedData.desmos_solution as DesmosSolution
    const newSolution: DesmosSolution = { ...solution }
    newSolution.viewport = { ...newSolution.viewport, [field]: value }
    updateDesmosSolution(newSolution)
  }

  const saveToDatabase = async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to save questions')
      return
    }

    const questionData = isEditing ? editedData : localData

    // Validate required fields
    if (!questionData.question?.trim()) {
      toast.error('Question text is required')
      return
    }
    if (!questionData.topic_name?.trim()) {
      toast.error('Topic is required')
      return
    }
    if (!questionData.explanation?.trim()) {
      toast.error('Rationale/explanation is required')
      return
    }

    setIsSavingToDb(true)

    try {
      // Transform the question data to match CreateQuestionData format
      const createQuestionData: CreateQuestionData = {
        subject_type: 'math', // Default to math since this is SAT math
        subject: 'math',
        difficulty: questionData.difficulty || 'Medium',
        type: questionData.type || 'MCQ',
        topic: questionData.topic_name || '',
        subtopic: questionData.subtopic_name || '',
        question: questionData.question || '',
        choices: questionData.choices || [],
        correct_answer: questionData.correct_answer || '',
        rationale: questionData.explanation || '',
        hints: questionData.hints || [],
        tags: questionData.tags || [],
        has_latex: questionData.has_latex || false,
        rationale_has_latex: questionData.explanation?.includes('$') || questionData.explanation?.includes('\\') || false,
        desmos_method_has_latex: false, // Not used in this component
        hints_has_latex: questionData.hints?.some(hint => hint.includes('$') || hint.includes('\\')) || false,
        diagram: null, // File upload not supported in this component
        diagram_preview: undefined,
        desmos_solution: questionData.desmos_solution as CreateQuestionData['desmos_solution'],
        desmos_method: questionData.desmos_method || ''
      }

      const result = await questionsApi.createQuestion(session.access_token, createQuestionData)
      
      toast.success('Question saved to database successfully!')
      console.log('Question saved with ID:', result.question_id)
    } catch (error) {
      console.error('Error saving question to database:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Failed to save question. Please try again.')
      }
    } finally {
      setIsSavingToDb(false)
    }
  }

  const currentData = isEditing ? editedData : localData

  return (
    <Card className="w-full transition-all duration-200 border-0 shadow-none">
      <QuestionHeader
        title={title}
        data={currentData}
        isEditing={isEditing}
        hasChanges={hasChanges}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onReset={handleReset}
        onSaveToDb={saveToDatabase}
        isSavingToDb={isSavingToDb}
      />

      <CardContent className="space-y-5">
        <TopicInformation
          data={localData}
          isEditing={isEditing}
          editedData={editedData}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onUpdateTag={updateTag}
        />

        <QuestionContent
          data={localData}
          isEditing={isEditing}
          editedData={editedData}
          onUpdateField={updateField}
          onUpdateChoice={updateChoice}
        />

        <IRTParameters
          data={localData}
          isEditing={isEditing}
          editedData={editedData}
          onUpdateField={updateField}
        />

        <HintsSection
          data={localData}
          isEditing={isEditing}
          editedData={editedData}
          onAddHint={addHint}
          onRemoveHint={removeHint}
          onUpdateHint={updateHint}
        />

        <DesmosSection
          data={localData}
          isEditing={isEditing}
          editedData={editedData}
          onUpdateField={updateField}
          onInitializeSolution={initializeDesmosSolution}
          onAddExpression={addDesmosExpression}
          onRemoveExpression={removeDesmosExpression}
          onUpdateExpression={updateDesmosExpression}
          onUpdateSlider={updateDesmosSlider}
          onUpdateTable={updateDesmosTable}
          onAddTableColumn={addDesmosTableColumn}
          onRemoveTableColumn={removeDesmosTableColumn}
          onUpdateTableValues={updateDesmosTableValues}
          onUpdateRegression={updateDesmosRegression}
          onUpdateViewport={updateDesmosViewport}
        />
      </CardContent>
    </Card>
  )
} 