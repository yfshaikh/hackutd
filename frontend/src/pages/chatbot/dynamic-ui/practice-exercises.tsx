import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, HelpCircle } from "lucide-react"

interface Exercise {
  id: string
  question: string
  hint?: string
  solution: string
}

interface PracticeExercisesProps {
  data: Exercise[]
}

export function PracticeExercises({ data }: PracticeExercisesProps) {
  const [currentExercise, setCurrentExercise] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [showHint, setShowHint] = useState<Record<string, boolean>>({})
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({})

  const handleAnswerChange = (id: string, value: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const toggleHint = (id: string) => {
    setShowHint((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toggleSolution = (id: string) => {
    setShowSolution((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleNext = () => {
    if (currentExercise < data.length - 1) {
      setCurrentExercise(currentExercise + 1)
    }
  }

  const handlePrevious = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1)
    }
  }

  const exercise = data[currentExercise]

  return (
    <div className="space-y-6">
      <Card className="glass-surface border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground flex justify-between">
            <span>Exercise {currentExercise + 1}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentExercise + 1} of {data.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 glass-input rounded-lg border border-white/10">
            <p className="text-foreground whitespace-pre-line">{exercise.question}</p>
          </div>

          {showHint[exercise.id] && exercise.hint && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-1">Hint:</p>
              <p className="text-blue-600">{exercise.hint}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="answer" className="text-sm font-medium text-foreground">
              Your Answer:
            </label>
            <Textarea
              id="answer"
              placeholder="Type your solution here..."
              className="glass-input border border-white/20"
              value={userAnswers[exercise.id] || ""}
              onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
              rows={4}
            />
          </div>

          {showSolution[exercise.id] && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-700 mb-1">Solution:</p>
              <p className="text-green-600 whitespace-pre-line">{exercise.solution}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-white/10 pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleHint(exercise.id)}
              disabled={!exercise.hint}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              {showHint[exercise.id] ? "Hide Hint" : "Show Hint"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleSolution(exercise.id)}
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {showSolution[exercise.id] ? "Hide Solution" : "Show Solution"}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentExercise === 0}
              className="border-white/20 text-foreground hover:bg-white/20"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentExercise === data.length - 1}
              className="border-white/20 text-foreground hover:bg-white/20"
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
