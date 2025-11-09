import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

interface FlashcardData {
  id: string
  front: string
  back: string
}

interface FlashcardsProps {
  data: FlashcardData[]
}

export function Flashcards({ data }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setFlipped(false)
    }
  }

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card
        className="h-80 cursor-pointer perspective-1000 glass-surface border border-white/20 shadow-lg"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${flipped ? "rotate-y-180" : ""}`}
        >
          <CardContent className="absolute w-full h-full flex items-center justify-center p-8 backface-hidden bg-gradient-to-br from-blue-50/80 to-purple-50/80 rounded-lg border">
            <p className="text-xl font-medium text-center leading-relaxed text-foreground">{data[currentIndex].front}</p>
          </CardContent>
          <CardContent className="absolute w-full h-full flex items-center justify-center p-8 backface-hidden rotate-y-180 bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-lg border">
            <p className="text-lg text-center leading-relaxed text-foreground">{data[currentIndex].back}</p>
          </CardContent>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="lg"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="glass-input border border-white/20 text-foreground hover:bg-white/30"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Previous
        </Button>

        <div className="text-lg font-medium text-foreground glass-surface px-4 py-2 rounded-lg border border-white/10">
          {currentIndex + 1} / {data.length}
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={handleNext}
          disabled={currentIndex === data.length - 1}
          className="glass-input border border-white/20 text-foreground hover:bg-white/30"
        >
          Next
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="lg"
        className="w-full text-foreground hover:bg-white/20"
        onClick={() => setFlipped(!flipped)}
      >
        <RotateCcw className="h-5 w-5 mr-2" />
        Flip Card
      </Button>
    </div>
  )
}
