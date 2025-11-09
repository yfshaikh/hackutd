/**
 * AdditionalToolsBar - Top toolbar for additional chat tools
 * 
 * This component displays additional tools/buttons above the chat interface.
 * It's configurable through the ChatConfig and can include custom React elements.
 */

import React from 'react'

interface AdditionalToolsBarProps {
  tools: React.ReactNode[]
}

export function AdditionalToolsBar({ tools }: AdditionalToolsBarProps) {
  if (!tools || tools.length === 0) return null

  return (
    <div className="flex-shrink-0 px-4 sm:px-6 py-2 border-b border-border">
      <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto">
        {tools.map((tool, index) => (
          <div key={index} className="flex-shrink-0">{tool}</div>
        ))}
      </div>
    </div>
  )
} 