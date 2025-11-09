import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Trophy } from "lucide-react"
import type { QuizQuestion } from "@/types/question"

interface QuizProps {
  quizData: QuizQuestion[]
}

export function Quiz({ quizData }: QuizProps) {
   
  console.log('Original data:', quizData)
  
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [frqAnswer, setFrqAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Handle case where quizData is undefined, null, or empty
  if (!quizData || quizData.length === 0) {
    return (
      <Card className="glass-surface border border-white/20">
        <CardContent className="text-center p-8">
          <p className="text-lg text-muted-foreground">
            Unable to load quiz questions. Please check the data format.
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentQuestionData = quizData[currentQuestion]
  const isMCQ = currentQuestionData.type === "MCQ"

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
  }

  const handleFrqChange = (value: string) => {
    setFrqAnswer(value)
  }

  const handleSubmit = () => {
    const userAnswer = isMCQ ? selectedOption : frqAnswer.trim()
    if (!userAnswer) return

    let isCorrect = false
    
    if (isMCQ) {
      // For MCQ, convert selected option key to index (A=0, B=1, C=2, D=3)
      const optionToIndex: { [key: string]: number } = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }
      const selectedIndex = optionToIndex[userAnswer]
      isCorrect = selectedIndex === Number(currentQuestionData.correct_answer)
    } else {
      // For FRQ, compare case-insensitive trimmed strings
      isCorrect = userAnswer.toLowerCase() === currentQuestionData.correct_answer.toLowerCase()
    }

    if (isCorrect) {
      setScore(score + 1)
    }

    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedOption(null)
      setFrqAnswer("")
      setShowResult(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedOption(null)
    setFrqAnswer("")
    setShowResult(false)
    setScore(0)
    setQuizCompleted(false)
  }

  // Convert answer_choices object to array with labels (only for MCQ)
  const getCurrentQuestionOptions = () => {
    if (!isMCQ || !currentQuestionData.answer_choices) return []
    
    const choices = currentQuestionData.answer_choices
    return [
      { key: 'A', value: choices.A },
      { key: 'B', value: choices.B },
      { key: 'C', value: choices.C },
      { key: 'D', value: choices.D }
    ].filter(option => option.value && option.value.trim() !== '') // Filter out empty options
  }

  if (quizCompleted) {
    return (
      <Card className="glass-surface border border-white/20">
        <CardContent className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-foreground">Quiz Completed!</h2>
          <p className="text-xl mb-6 text-foreground">
            Your Score:{" "}
            <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {score}/{quizData.length}
            </span>
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            {score === quizData.length
              ? "Perfect score! Excellent work! 🎉"
              : score >= quizData.length * 0.8
                ? "Great job! You're doing well! 👏"
                : score >= quizData.length * 0.6
                  ? "Good effort! Keep studying! 📚"
                  : "Keep practicing! You'll improve with time! 💪"}
          </p>
          <Button
            onClick={handleRestart}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
          >
            Take Quiz Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  const options = getCurrentQuestionOptions()

  return (
    <Card className="glass-surface border border-white/20">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center text-foreground">
          <span>
            Question {currentQuestion + 1} of {quizData.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm glass-surface px-2 py-1 rounded border border-white/10">
              {currentQuestionData.type}
            </span>
            <span className="text-lg font-normal glass-surface px-3 py-1 rounded-lg border border-white/10">
              Score: {score}/{quizData.length}
            </span>
          </div>
        </CardTitle>
        {currentQuestionData.topic_name && (
          <div className="text-sm text-muted-foreground">
            {currentQuestionData.topic_name}
            {currentQuestionData.subtopic_name && ` • ${currentQuestionData.subtopic_name}`}
            {currentQuestionData.difficulty && ` • Difficulty: ${currentQuestionData.difficulty}`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-lg font-medium leading-relaxed text-foreground">{currentQuestionData.body}</p>

          {isMCQ ? (
            <RadioGroup value={selectedOption || ''} onValueChange={handleOptionChange} className="space-y-3">
              {options.map((option, index) => {
                // Check if this option is the correct answer by comparing index
                const isCorrectOption = index === Number(currentQuestionData.correct_answer)
                const isSelectedWrong = showResult && option.key === selectedOption && !isCorrectOption
                
                return (
                <div
                  key={option.key}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-300 ${
                    showResult && isCorrectOption
                      ? "bg-green-50 border-green-300 shadow-lg shadow-green-200/50"
                      : isSelectedWrong
                        ? "bg-red-50 border-red-300 shadow-lg shadow-red-200/50"
                        : "border-white/20 hover:bg-white/20 hover:border-white/30 glass-input"
                  }`}
                >
                  <RadioGroupItem value={option.key} id={`option-${option.key}`} disabled={showResult} />
                  <Label htmlFor={`option-${option.key}`} className="flex-1 cursor-pointer text-foreground">
                    <span className="font-medium mr-2">{option.key}.</span>
                    {option.value}
                  </Label>
                  {showResult && isCorrectOption && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                  {showResult && isSelectedWrong && (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                )
              })}
            </RadioGroup>
          ) : (
            <div className="space-y-4">
              <Label htmlFor="frq-answer" className="text-sm font-medium text-foreground">
                Enter your answer:
              </Label>
              <div className={`relative ${showResult ? 'pointer-events-none' : ''}`}>
                <Input
                  id="frq-answer"
                  value={frqAnswer}
                  onChange={(e) => handleFrqChange(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={showResult}
                  className={`glass-input text-lg ${
                    showResult
                      ? frqAnswer.toLowerCase().trim() === currentQuestionData.correct_answer.toLowerCase()
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                      : ""
                  }`}
                />
                {showResult && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {frqAnswer.toLowerCase().trim() === currentQuestionData.correct_answer.toLowerCase() ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {showResult && frqAnswer.toLowerCase().trim() !== currentQuestionData.correct_answer.toLowerCase() && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Correct answer:</span> {currentQuestionData.correct_answer}
                  </p>
                </div>
              )}
            </div>
          )}

          {showResult && currentQuestionData.rationale && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
              <p className="text-blue-800">{currentQuestionData.rationale}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {showResult ? (
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
          >
            {currentQuestion < quizData.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isMCQ ? selectedOption === null : frqAnswer.trim() === ""}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50"
          >
            Submit Answer
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
