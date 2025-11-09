import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Lightbulb, BookOpen, Sparkles, Target, Award } from "lucide-react"

interface SATQuestionProps {
  data: {
    id?: string
    question: string
    choices?: string[]
    correct_answer?: string
    explanation: string
    hints?: string[]
    tags?: string[]
    difficulty: string
    subject: string
    type: string
    topic: string
    subtopic: string
    has_latex?: boolean
    crew_generated?: boolean
  }
}

export function SATQuestion({ data }: SATQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [frqAnswer, setFrqAnswer] = useState<string>("")
  const [showResult, setShowResult] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  if (!data) {
    return (
      <Card className="backdrop-blur-xl bg-white/70 border border-white/30 shadow-2xl">
        <CardContent className="text-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-xl font-semibold text-slate-700">
              Unable to load SAT question
            </p>
            <p className="text-sm text-slate-500">
              Please check the data format and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isMCQ = data.type === "MCQ"
  const isCrewGenerated = data.crew_generated

  const handleOptionChange = (value: string) => {
    setSelectedOption(value)
  }

  const handleFrqChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFrqAnswer(e.target.value)
  }

  const handleSubmit = () => {
    const userAnswer = isMCQ ? selectedOption : frqAnswer.trim()
    if (!userAnswer) return

    setShowResult(true)
    setShowExplanation(true)
  }

  const handleReset = () => {
    setSelectedOption(null)
    setFrqAnswer("")
    setShowResult(false)
    setShowHints(false)
    setShowExplanation(false)
  }

  const isCorrect = isMCQ 
    ? data.correct_answer && selectedOption === data.correct_answer
    : data.correct_answer && frqAnswer.trim().toLowerCase() === data.correct_answer.toLowerCase()

  // Format question text for LaTeX if needed
  const formatText = (text: string) => {
    if (!data.has_latex) return text
    // Basic LaTeX formatting - in a real app, you'd use a proper LaTeX renderer like KaTeX
    return text.replace(/\$([^$]+)\$/g, '<em style="font-style: italic; color: #3b82f6;">$1</em>')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'hard': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Enhanced header with metadata */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl blur-xl" />
        <div className="relative backdrop-blur-sm bg-white/80 border border-white/40 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  SAT Practice Question
                </h1>
                <p className="text-sm text-slate-500">Test your knowledge and skills</p>
              </div>
            </div>
            {isCrewGenerated && (
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Crew Generated
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-white/60 backdrop-blur-sm border-blue-200 text-blue-700 hover:bg-blue-50">
              <BookOpen className="h-3 w-3 mr-1" />
              {data.subject} • {data.topic}
            </Badge>
            <Badge variant="outline" className="bg-white/60 backdrop-blur-sm border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              {data.subtopic}
            </Badge>
            <Badge className={`${getDifficultyColor(data.difficulty)} border font-medium`}>
              {data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)}
            </Badge>
            <Badge variant="outline" className={`${isMCQ ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              {data.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Main Question Card */}
      <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-2xl shadow-blue-100/20 rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Question Text with enhanced styling */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 to-blue-50/60 rounded-2xl blur-sm" />
              <div 
                className="relative text-xl font-medium leading-relaxed text-slate-800 p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-inner"
                dangerouslySetInnerHTML={{ __html: formatText(data.question) }}
              />
            </div>

            {/* Enhanced Answer Choices (MCQ) */}
            {isMCQ && data.choices && (
              <RadioGroup 
                value={selectedOption || ''} 
                onValueChange={handleOptionChange} 
                className="space-y-4"
                disabled={showResult}
              >
                {data.choices.map((choice, index) => {
                  const optionKey = choice.charAt(0) // Extract A, B, C, D
                  const isCorrectOption = data.correct_answer && optionKey === data.correct_answer
                  const isSelectedWrong = showResult && optionKey === selectedOption && !isCorrectOption
                  {/* note, replaced key w/ index instead of optionKey, may cause errors */}
                  return (
                    <div
                      key={index}
                      className={`relative group transition-all duration-500 ${
                        showResult && isCorrectOption
                          ? "transform scale-[1.02]"
                          : isSelectedWrong
                            ? "transform scale-[0.98]"
                            : "hover:scale-[1.01]"
                      }`}
                    >
                      <div
                        className={`flex items-center space-x-4 p-6 rounded-2xl border-2 transition-all duration-500 backdrop-blur-sm ${
                          showResult && isCorrectOption
                            ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 shadow-lg shadow-emerald-200/50"
                            : isSelectedWrong
                              ? "bg-gradient-to-r from-rose-50 to-red-50 border-rose-300 shadow-lg shadow-rose-200/50"
                              : "bg-white/60 border-white/40 hover:bg-white/80 hover:border-blue-200/60 hover:shadow-lg shadow-sm"
                        }`}
                      >
                        <div className="relative flex items-center">
                          <RadioGroupItem 
                            value={optionKey} 
                            id={`option-${optionKey}`} 
                            className={`w-6 h-6 ${
                              showResult && isCorrectOption 
                                ? "border-emerald-500 text-emerald-600" 
                                : isSelectedWrong 
                                  ? "border-rose-500 text-rose-600"
                                  : ""
                            }`}
                          />
                          <div className={`ml-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            showResult && isCorrectOption
                              ? "bg-emerald-500 text-white"
                              : isSelectedWrong
                                ? "bg-rose-500 text-white"
                                : "bg-slate-200 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                          }`}>
                            {optionKey}
                          </div>
                        </div>
                        
                        <Label 
                          htmlFor={`option-${optionKey}`} 
                          className="flex-1 cursor-pointer text-slate-800 font-medium leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatText(choice.substring(2)) }}
                        />
                        
                        {showResult && isCorrectOption && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 shadow-lg">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        )}
                        {showResult && isSelectedWrong && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 shadow-lg">
                            <XCircle className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            )}

            {/* Enhanced FRQ Answer Input */}
            {!isMCQ && (
              <div className="space-y-6">
                <Label htmlFor="frq-answer" className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Your Answer:
                </Label>
                <Textarea
                  id="frq-answer"
                  value={frqAnswer}
                  onChange={handleFrqChange}
                  placeholder="Enter your detailed answer here..."
                  className="backdrop-blur-sm bg-white/70 border-2 border-white/40 rounded-2xl min-h-[120px] text-lg p-6 focus:border-blue-300 focus:bg-white/90 transition-all duration-300 shadow-inner"
                  disabled={showResult}
                />
                {showResult && (
                  <div className={`p-6 rounded-2xl border-2 backdrop-blur-sm transition-all duration-500 ${
                    isCorrect 
                      ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 shadow-lg shadow-emerald-200/50" 
                      : "bg-gradient-to-r from-rose-50 to-red-50 border-rose-300 shadow-lg shadow-rose-200/50"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCorrect ? "bg-emerald-500" : "bg-rose-500"
                      }`}>
                        {isCorrect ? <CheckCircle className="h-6 w-6 text-white" /> : <XCircle className="h-6 w-6 text-white" />}
                      </div>
                      <span className={`text-xl font-bold ${
                        isCorrect ? "text-emerald-800" : "text-rose-800"
                      }`}>
                        {isCorrect ? "Excellent!" : "Not quite right"}
                      </span>
                    </div>
                    {data.correct_answer && (
                      <p className={`mt-4 text-lg font-medium ${
                        isCorrect ? "text-emerald-700" : "text-rose-700"
                      }`}>
                        Correct answer: {data.correct_answer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="flex gap-4 pt-6">
              {!showResult ? (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isMCQ ? !selectedOption : !frqAnswer.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button 
                  onClick={handleReset} 
                  className="bg-white/80 hover:bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  Try Again
                </Button>
              )}
              
              {data.hints && data.hints.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowHints(!showHints)}
                  className="bg-white/60 hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-300 text-amber-700 text-lg px-6 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  <Lightbulb className="h-5 w-5 mr-2" />
                  {showHints ? 'Hide' : 'Show'} Hints
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Hints Section */}
      {showHints && data.hints && data.hints.length > 0 && (
        <Card className="backdrop-blur-xl bg-gradient-to-r from-amber-50/80 to-yellow-50/80 border border-amber-200/60 shadow-2xl shadow-amber-100/20 rounded-3xl overflow-hidden">
          <CardHeader className="bg-white/40 backdrop-blur-sm">
            <CardTitle className="text-2xl flex items-center gap-3 text-amber-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              Helpful Hints
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {data.hints.map((hint, index) => (
                <div key={index} className="flex items-start gap-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0 shadow-lg">
                    {index + 1}
                  </div>
                  <p 
                    className="text-slate-800 font-medium leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: formatText(hint) }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Explanation Section */}
      {showExplanation && (
        <Card className="backdrop-blur-xl bg-gradient-to-r from-emerald-50/80 to-green-50/80 border border-emerald-200/60 shadow-2xl shadow-emerald-100/20 rounded-3xl overflow-hidden">
          <CardHeader className="bg-white/40 backdrop-blur-sm">
            <CardTitle className="text-2xl flex items-center gap-3 text-emerald-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              Detailed Explanation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div 
              className="text-slate-800 leading-relaxed text-lg font-medium p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-inner"
              dangerouslySetInnerHTML={{ __html: formatText(data.explanation) }}
            />
            {data.tags && data.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-emerald-200/50">
                <p className="text-lg font-semibold text-emerald-800 mb-4">Related Topics:</p>
                <div className="flex flex-wrap gap-3">
                  {data.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="bg-white/60 border-emerald-200 text-emerald-700 px-4 py-2 text-sm font-medium hover:bg-emerald-50 transition-all duration-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 