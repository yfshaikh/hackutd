import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface VocabularyItem {
  id: string
  term: string
  definition: string
  example?: string
}

interface VocabularyListProps {
  data: VocabularyItem[]
}

export function VocabularyList({ data }: VocabularyListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const filteredData = data.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search terms or definitions..."
          className="pl-10 glass-input border border-white/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredData.map((item) => (
          <Card
            key={item.id}
            className={`glass-surface border border-white/20 transition-all duration-300 ${
              expandedItems[item.id] ? "shadow-lg shadow-blue-200/20" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-foreground">{item.term}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(item.id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {expandedItems[item.id] ? "Less" : "More"}
                </Button>
              </div>
              <p className="text-muted-foreground mt-1">{item.definition}</p>
              {expandedItems[item.id] && item.example && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-sm text-muted-foreground mb-1">Example:</p>
                  <p className="text-foreground italic">{item.example}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
