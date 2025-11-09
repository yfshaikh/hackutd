import { Card, CardContent } from "@/components/ui/card"

interface TimelineEvent {
  id: string
  year: string
  title: string
  description: string
}

interface TimelineProps {
  data: TimelineEvent[]
}

export function Timeline({ data }: TimelineProps) {
  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:left-9 before:ml-px before:h-full before:border-l-2 before:border-slate-300/40 pl-10">
      {data.map((event, index) => (
        <div key={event.id} className="relative">
          <div className="absolute left-[-40px] flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
            <span className="text-white text-xs font-bold">{index + 1}</span>
          </div>

          <Card className="glass-surface border border-white/20 shadow-sm">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center">
                <span className="text-sm font-bold text-blue-600">{event.year}</span>
                <span className="ml-2 h-px flex-1 bg-slate-300/40"></span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{event.title}</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
