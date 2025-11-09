import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MediaItem {
  id: string
  type: "gif" | "mp4" | "image"
  url: string
  title: string
  description?: string
}

interface MediaRendererProps {
  data: MediaItem[]
}

export function MediaRenderer({ data }: MediaRendererProps) {
  return (
    <div className="space-y-6">
      {data.map((item) => (
        <Card key={item.id} className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">{item.title}</CardTitle>
            {item.description && <p className="text-slate-300">{item.description}</p>}
          </CardHeader>
          <CardContent>
            {item.type === "gif" || item.type === "image" ? (
              <img
                src={item.url || "/placeholder.svg"}
                alt={item.title}
                className="w-full rounded-lg shadow-lg"
                style={{ maxHeight: "400px", objectFit: "contain" }}
              />
            ) : item.type === "mp4" ? (
              <video controls className="w-full rounded-lg shadow-lg" style={{ maxHeight: "400px" }}>
                <source src={item.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
