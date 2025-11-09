import { useState } from "react"
import { ChatInterface } from "@/components/chatbot/components/chat-interface"
import { ThemeProvider } from "@/context/theme-context"

 
export default function ChatLearningPage() {
  // const [dynamicContent, setDynamicContent] = useState<any>(null)
  const [showContent] = useState(false)
  const [selectedContentType, setSelectedContentType] = useState("auto")


  const handleContentTypeChange = (type: string) => {
    setSelectedContentType(type)
  }

  return (
    <ThemeProvider>
      <div className="flex flex-col h-[calc(100vh-0rem)] bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 overflow-hidden">
        
        {/* Subtle background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-violet-50/10 z-0" />
        
        {/* Subtle grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] z-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            mixBlendMode: "overlay",
          }}
        />


        <div className="flex flex-1 overflow-hidden relative h-full z-10">


          {/* Main Content Area */}
          <div
            className={`flex flex-col transition-all duration-500 ease-in-out h-full ${
              showContent ? "w-1/2" : "w-full"} relative flex-1`}>
            {/* Tab Content */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
              <ChatInterface
                    selectedContentType={selectedContentType}
                    onContentTypeChange={handleContentTypeChange}
                    showContent={showContent}
                    // onContentGenerated={handleContentGenerated}
                  />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
