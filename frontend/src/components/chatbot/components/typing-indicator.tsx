// import type React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Bot } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start group animate-fade-in-up">
      <div className="shrink-0 relative">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground text-xs">
            <Bot className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="max-w-[80%] relative">
        <Card className="relative rounded-3xl transition-all duration-200 bg-card border-border">
          <CardContent className="px-3 py-2">
            <div className="flex items-center gap-2">
              {/* Animated Thinking Dots */}
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-secondary rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-accent rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 