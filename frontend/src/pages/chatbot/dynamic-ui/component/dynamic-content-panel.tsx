import { Button } from "@/components/ui/button"
import { Flashcards } from "../flashcards"
import { Quiz } from "../quiz"
import { ConceptGraph } from "../concept-graph"
import { Timeline } from "../timeline"
import { VocabularyList } from "../vocabulary-list"
import { PracticeExercises } from "../practice-exercises"
import { MediaRenderer } from "../media-renderer"
import { SATQuestion } from "../sat-question"
import { X, BookmarkPlus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import React from "react"

interface DynamicContentPanelProps {
  isOpen: boolean
  content: any
  onClose: () => void
  onSave: () => void
} 

export function DynamicContentPanel({ isOpen, content, onClose, onSave }: DynamicContentPanelProps) {
  
  // Prevent body scroll when sidebar is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  if (!content) {
    return null
  }

  return (
    <>
      {/* Semi-transparent overlay without blur - allows interaction with chat */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar - reduced width for better chat visibility */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] md:w-[500px] lg:w-[550px] xl:w-[600px] z-50 transform transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 0, height: '100vh' }}
      >
        <div className="h-full flex flex-col relative overflow-hidden shadow-2xl bg-white">
          {/* Enhanced background with multiple layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/80 to-violet-50/60 z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 z-0" />
          
          {/* Animated background patterns */}
          <div className="absolute inset-0 opacity-5 z-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000" />
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000" />
          </div>
          
          {/* Refined grain texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.02] z-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "100px 100px"
            }}
          />

          {/* Enhanced header with glass morphism */}
          <div className="relative z-20 flex items-center justify-between p-4 sm:p-5 border-b border-white/20 backdrop-blur-xl bg-white/30 shadow-lg flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse shadow-lg shadow-blue-500/20" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent truncate">
                  {content.title || 'Generated Content'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600/80 truncate">
                  Interactive learning content
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onSave} 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-600 hover:text-blue-700 hover:bg-white/40 backdrop-blur-sm transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-white/20 h-8 w-8 p-0"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"> 
                    <p>Save to library</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button 
                onClick={onClose} 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 hover:text-red-600 hover:bg-white/40 backdrop-blur-sm transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced content area */}
          <div className="relative z-10 flex-1 overflow-y-auto backdrop-blur-sm">
            <div className="p-4 sm:p-6 min-h-full">
              <div className="max-w-full mx-auto">
                {content.contentType === "flashcards" && <Flashcards data={content.data} />}
                {content.contentType === "quiz" && <Quiz quizData={content.data} />}
                {content.contentType === "sat_question" && <SATQuestion data={content.data} />}
                {content.contentType === "graph" && <ConceptGraph data={content.data} />}
                {content.contentType === "timeline" && <Timeline data={content.data} />}
                {content.contentType === "vocabulary" && <VocabularyList data={content.data} />}
                {content.contentType === "exercises" && <PracticeExercises data={content.data} />}
                {content.contentType === "media" && <MediaRenderer data={content.data} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
