/**
 * AuthenticationRequired - Shows authentication prompt for anonymous users
 * 
 * This component displays when users are not authenticated but can still
 * use the chat functionality. It explains that conversation history won't
 * be saved without signing in.
 */

// import React from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function AuthenticationRequired() {
  return (
    <div className="flex justify-center items-center py-8">
      <Card className="p-6 text-center">
        <CardContent>
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Sign in to save conversations</h3>
          <p className="text-sm text-muted-foreground">
            You can still chat, but your conversation history won't be saved.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 