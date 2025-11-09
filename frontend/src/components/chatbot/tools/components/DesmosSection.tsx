import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { BookOpen, Target, Plus, X } from 'lucide-react'
import { LaTeXRenderer } from '@/components/utils/latex-renderer'
import type { Question, DesmosSolution } from '@/types/question'

type SATQuestionData = Partial<Omit<Question, 'id'>>
type ExpressionType = 'equation' | 'point' | 'slider' | 'table' | 'regression' | 'inequality'

interface DesmosMethodProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onUpdateField: (field: keyof SATQuestionData, value: any) => void
}

interface DesmosSolutionProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onInitializeSolution: () => void
  onAddExpression: (type?: ExpressionType) => void
  onRemoveExpression: (index: number) => void
  onUpdateExpression: (index: number, field: string, value: any) => void
  onUpdateSlider: (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['slider']>, value: number | boolean) => void
  onUpdateTable: (index: number, columnIndex: number, field: string, value: any) => void
  onAddTableColumn: (index: number) => void
  onRemoveTableColumn: (index: number, columnIndex: number) => void
  onUpdateTableValues: (index: number, columnIndex: number, values: string) => void
  onUpdateRegression: (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['regression']>, value: string) => void
  onUpdateViewport: (field: keyof DesmosSolution['viewport'], value: number) => void
}

function DesmosMethod({ data, isEditing, editedData, onUpdateField }: DesmosMethodProps) {
  const currentData = isEditing ? editedData || data : data

  if (!currentData.desmos_method && !isEditing) {
    return null
  }

  return (
    <div className="flex items-start gap-2">
      <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <span className="text-sm font-medium text-foreground">
          Desmos Method
        </span>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedData?.desmos_method || ''}
              onChange={(e) => onUpdateField('desmos_method', e.target.value)}
              placeholder="Explain the method used in Desmos. Use LaTeX for math: $\\frac{1}{2}$, $\\sqrt{x}$, $x^2$, etc."
              className="min-h-[80px] resize-none"
            />
            {editedData?.desmos_method && (
              <div className="p-2 rounded-md border bg-muted/20">
                <Label className="text-xs font-medium">Preview:</Label>
                <div className="mt-1">
                  <LaTeXRenderer 
                    text={editedData.desmos_method} 
                    hasLatex={currentData.has_latex} 
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm p-2 rounded-md border bg-info/5 border-info/20">
            <LaTeXRenderer 
              text={currentData.desmos_method || ''} 
              hasLatex={currentData.has_latex} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

function DesmosExpressionEditor({ 
  expr, 
  index, 
  onUpdateExpression, 
  onRemoveExpression,
  onUpdateSlider,
  onUpdateTable,
  onAddTableColumn,
  onRemoveTableColumn,
  onUpdateTableValues,
  onUpdateRegression
}: {
  expr: any
  index: number
  onUpdateExpression: (index: number, field: string, value: any) => void
  onRemoveExpression: (index: number) => void
  onUpdateSlider: (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['slider']>, value: number | boolean) => void
  onUpdateTable: (index: number, columnIndex: number, field: string, value: any) => void
  onAddTableColumn: (index: number) => void
  onRemoveTableColumn: (index: number, columnIndex: number) => void
  onUpdateTableValues: (index: number, columnIndex: number, values: string) => void
  onUpdateRegression: (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['regression']>, value: string) => void
}) {
  return (
    <div className="p-3 border rounded-lg space-y-3 bg-background">
      {/* Expression Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-grow">
          <Label className="text-xs">ID</Label>
          <Input
            value={expr.id}
            onChange={(e) => onUpdateExpression(index, 'id', e.target.value)}
            className="h-7 text-xs"
            placeholder="e.g., eq1, pt1, slider_b"
          />
        </div>
        
        <div>
          <Label className="text-xs">Type</Label>
          <select
            value={expr.type}
            onChange={(e) => onUpdateExpression(index, 'type', e.target.value)}
            className="h-7 px-2 text-xs border border-border rounded-md"
          >
            <option value="equation">Equation</option>
            <option value="point">Point</option>
            <option value="slider">Slider</option>
            <option value="table">Table</option>
            <option value="regression">Regression</option>
            <option value="inequality">Inequality</option>
          </select>
        </div>
        
        <div>
          <Label className="text-xs">Color</Label>
          <select
            value={expr.color}
            onChange={(e) => onUpdateExpression(index, 'color', e.target.value)}
            className="h-7 px-2 text-xs border border-border rounded-md"
          >
            <option value="blue">Blue</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="black">Black</option>
          </select>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRemoveExpression(index)}
          className="h-7 text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {/* LaTeX Expression */}
      <div>
        <Label className="text-xs">
          {expr.type === 'slider' ? 'Variable Assignment' : 
           expr.type === 'table' ? 'Table Definition' :
           expr.type === 'regression' ? 'Regression Expression' :
           expr.type === 'inequality' ? 'Inequality Expression' :
           'LaTeX Expression'}
        </Label>
        <Textarea
          value={expr.latex}
          onChange={(e) => onUpdateExpression(index, 'latex', e.target.value)}
          placeholder={
            expr.type === 'equation' ? "e.g., y=2x+3" :
            expr.type === 'point' ? "e.g., (1,5)" :
            expr.type === 'slider' ? "e.g., b = 3" :
            expr.type === 'table' ? "Table will be defined below" :
            expr.type === 'regression' ? "e.g., y_1 ~ mx_1 + b" :
            expr.type === 'inequality' ? "e.g., y > 2x+3" :
            "LaTeX expression"
          }
          className="min-h-[60px] font-mono text-xs"
          disabled={expr.type === 'table'}
        />
      </div>

      {/* Type-specific Controls */}
      {expr.type === 'equation' && (
        <div>
          <Label className="text-xs">Line Style</Label>
          <select
            value={expr.lineStyle || 'solid'}
            onChange={(e) => onUpdateExpression(index, 'lineStyle', e.target.value)}
            className="block w-full h-7 px-2 text-xs border border-border rounded-md"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
      )}

      {expr.type === 'point' && (
        <div>
          <Label className="text-xs">Point Style</Label>
          <select
            value={expr.pointStyle || 'open'}
            onChange={(e) => onUpdateExpression(index, 'pointStyle', e.target.value)}
            className="block w-full h-7 px-2 text-xs border border-border rounded-md"
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cross">Cross</option>
          </select>
        </div>
      )}

      {expr.type === 'slider' && expr.slider && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Slider Settings</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                value={expr.slider.min}
                onChange={(e) => onUpdateSlider(index, 'min', Number(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                value={expr.slider.max}
                onChange={(e) => onUpdateSlider(index, 'max', Number(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Step</Label>
              <Input
                type="number"
                step="0.1"
                value={expr.slider.step}
                onChange={(e) => onUpdateSlider(index, 'step', Number(e.target.value))}
                className="h-7 text-xs"
              />
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                checked={expr.slider.playing}
                onChange={(e) => onUpdateSlider(index, 'playing', e.target.checked)}
                className="w-4 h-4"
              />
              <Label className="text-xs">Auto-playing</Label>
            </div>
          </div>
        </div>
      )}

      {expr.type === 'table' && expr.table && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Table Data</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddTableColumn(index)}
              className="h-6 px-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Column
            </Button>
          </div>
          <div className="space-y-2">
            {expr.table.columns.map((column: any, colIndex: number) => (
              <div key={colIndex} className="flex gap-2 items-start">
                <div className="w-20">
                  <Label className="text-xs">Column ID</Label>
                  <Input
                    value={column.id}
                    onChange={(e) => onUpdateTable(index, colIndex, 'id', e.target.value)}
                    className="h-7 text-xs"
                    placeholder="x_1"
                  />
                </div>
                <div className="flex-grow">
                  <Label className="text-xs">Values (comma-separated)</Label>
                  <Textarea
                    value={column.values.join(', ')}
                    onChange={(e) => onUpdateTableValues(index, colIndex, e.target.value)}
                    className="min-h-[60px] text-xs"
                    placeholder="0, 4, 8, 12"
                  />
                </div>
                {expr.table!.columns.length > 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveTableColumn(index, colIndex)}
                    className="h-7 w-7 p-0 mt-6 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {expr.type === 'regression' && expr.regression && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Regression Settings</Label>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label className="text-xs">Regression Type</Label>
              <select
                value={expr.regression.regressionType}
                onChange={(e) => onUpdateRegression(index, 'regressionType', e.target.value)}
                className="block w-full h-7 px-2 text-xs border border-border rounded-md"
              >
                <option value="linear">Linear</option>
                <option value="quadratic">Quadratic</option>
                <option value="exponential">Exponential</option>
                <option value="logarithmic">Logarithmic</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Independent Variable</Label>
              <Input
                value={expr.regression.independentVariable}
                onChange={(e) => onUpdateRegression(index, 'independentVariable', e.target.value)}
                className="h-7 text-xs"
                placeholder="x_1"
              />
            </div>
            <div>
              <Label className="text-xs">Dependent Variable</Label>
              <Input
                value={expr.regression.dependentVariable}
                onChange={(e) => onUpdateRegression(index, 'dependentVariable', e.target.value)}
                className="h-7 text-xs"
                placeholder="y_1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DesmosSolutionEditor({
  data,
  isEditing,
  editedData,
  onInitializeSolution,
  onAddExpression,
  onRemoveExpression,
  onUpdateExpression,
  onUpdateSlider,
  onUpdateTable,
  onAddTableColumn,
  onRemoveTableColumn,
  onUpdateTableValues,
  onUpdateRegression,
  onUpdateViewport
}: DesmosSolutionProps) {
  const currentData = isEditing ? editedData || data : data

  if (!currentData.desmos_solution && !isEditing) {
    return null
  }

  return (
    <div className="flex items-start gap-2">
      <Target className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Desmos Solution
          </span>
          {isEditing && !editedData?.desmos_solution && (
            <Button size="sm" variant="outline" onClick={onInitializeSolution} className="h-6 px-2">
              <Plus className="h-3 w-3 mr-1" />
              Add Desmos Solution
            </Button>
          )}
        </div>
        
        {isEditing && editedData?.desmos_solution ? (
          <div className="space-y-4 p-4 border rounded-md bg-muted/5">
            {/* Add Expression Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onAddExpression('equation')}>
                Add Equation
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAddExpression('point')}>
                Add Point
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAddExpression('slider')}>
                Add Slider
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAddExpression('table')}>
                Add Table
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAddExpression('regression')}>
                Add Regression
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAddExpression('inequality')}>
                Add Inequality
              </Button>
            </div>

            {/* Expressions */}
            <div>
              <Label className="text-sm font-medium">Expressions</Label>
              {(editedData.desmos_solution as DesmosSolution).expressions.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 border-2 border-dashed border-border rounded-lg mt-2">
                  <p>No expressions added yet.</p>
                  <p className="text-xs">Click "Add Equation", "Add Point", or other buttons to start.</p>
                </div>
              ) : (
                <div className="space-y-4 mt-2">
                  {(editedData.desmos_solution as DesmosSolution).expressions.map((expr: any, index: number) => (
                    <DesmosExpressionEditor
                      key={index}
                      expr={expr}
                      index={index}
                      onUpdateExpression={onUpdateExpression}
                      onRemoveExpression={onRemoveExpression}
                      onUpdateSlider={onUpdateSlider}
                      onUpdateTable={onUpdateTable}
                      onAddTableColumn={onAddTableColumn}
                      onRemoveTableColumn={onRemoveTableColumn}
                      onUpdateTableValues={onUpdateTableValues}
                      onUpdateRegression={onUpdateRegression}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Viewport Settings */}
            <div>
              <Label className="text-sm font-medium">Viewport</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <Label className="text-xs">X Min</Label>
                  <Input
                    type="number"
                    value={(editedData.desmos_solution as DesmosSolution).viewport.xmin}
                    onChange={(e) => onUpdateViewport('xmin', parseFloat(e.target.value) || -10)}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">X Max</Label>
                  <Input
                    type="number"
                    value={(editedData.desmos_solution as DesmosSolution).viewport.xmax}
                    onChange={(e) => onUpdateViewport('xmax', parseFloat(e.target.value) || 10)}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Min</Label>
                  <Input
                    type="number"
                    value={(editedData.desmos_solution as DesmosSolution).viewport.ymin}
                    onChange={(e) => onUpdateViewport('ymin', parseFloat(e.target.value) || -10)}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Max</Label>
                  <Input
                    type="number"
                    value={(editedData.desmos_solution as DesmosSolution).viewport.ymax}
                    onChange={(e) => onUpdateViewport('ymax', parseFloat(e.target.value) || 10)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Configure Desmos expressions, sliders, tables, and viewport settings for your solution.
            </p>
          </div>
        ) : currentData.desmos_solution ? (
          <div className="text-sm p-3 rounded-md border bg-muted/20">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Expressions:</span> {(currentData.desmos_solution as DesmosSolution)?.expressions?.length || 0}
              </div>
              <div>
                <span className="font-medium">Viewport:</span> x[{(currentData.desmos_solution as DesmosSolution)?.viewport?.xmin || 0}, {(currentData.desmos_solution as DesmosSolution)?.viewport?.xmax || 0}], y[{(currentData.desmos_solution as DesmosSolution)?.viewport?.ymin || 0}, {(currentData.desmos_solution as DesmosSolution)?.viewport?.ymax || 0}]
              </div>
              {((currentData.desmos_solution as DesmosSolution)?.expressions?.length || 0) > 0 && (
                <div className="space-y-1">
                  <span className="font-medium block">Active Expressions:</span>
                  {(currentData.desmos_solution as DesmosSolution)?.expressions
                    ?.map((expr: any, index: number) => (
                      <div key={index} className="text-xs bg-muted/30 p-1 rounded font-mono">
                        {expr.latex || `${expr.type} (${expr.id})`}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export interface DesmosProps {
  data: SATQuestionData
  isEditing: boolean
  editedData?: SATQuestionData
  onUpdateField: (field: keyof SATQuestionData, value: any) => void
  onInitializeSolution: () => void
  onAddExpression: (type?: ExpressionType) => void
  onRemoveExpression: (index: number) => void
  onUpdateExpression: (index: number, field: string, value: any) => void
  onUpdateSlider: (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['slider']>, value: number | boolean) => void
  onUpdateTable: (index: number, columnIndex: number, field: string, value: any) => void
  onAddTableColumn: (index: number) => void
  onRemoveTableColumn: (index: number, columnIndex: number) => void
  onUpdateTableValues: (index: number, columnIndex: number, values: string) => void
  onUpdateRegression: (index: number, field: keyof NonNullable<DesmosSolution['expressions'][0]['regression']>, value: string) => void
  onUpdateViewport: (field: keyof DesmosSolution['viewport'], value: number) => void
}

export function DesmosSection(props: DesmosProps) {
  return (
    <div className="space-y-5">
      <DesmosMethod {...props} />
      <DesmosSolutionEditor {...props} />
    </div>
  )
} 