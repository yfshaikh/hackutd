import React from 'react'
import { useRecentPosts } from '@/hooks/useDashboard'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { SocialMediaPost } from '@/lib/api/dashboard'

// Function to generate avatar based on author name
const getAvatarUrl = (author: string) => {
  // Using UI Avatars service for consistent avatar generation
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=random&size=128`
}

// Function to format time ago
const getTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

interface PostCardProps {
  post: SocialMediaPost
  index: number
}

const PostCard: React.FC<PostCardProps> = ({ post, index }) => {
  const handleClick = () => {
    window.open(post.url, '_blank', 'noopener,noreferrer')
  }

  // Truncate content to ~150 characters
  const truncateContent = (text: string) => {
    const cleanText = text || post.title
    if (cleanText.length <= 150) return cleanText
    return cleanText.substring(0, 150) + '...'
  }

  return (
    <Card
      className="cursor-pointer transition-all duration-300 relative overflow-hidden mb-3 hover:scale-[1.02] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <p className="text-sm mb-3 leading-relaxed line-clamp-3">
          {truncateContent(post.content)}
        </p>

        <div className="flex items-center space-x-2">
          <Avatar className="w-7 h-7">
            <AvatarImage src={getAvatarUrl(post.author)} alt={post.author} />
            <AvatarFallback>
              {post.author.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs">
              {post.author}
            </p>
            <p className="text-xs text-muted-foreground">
              Reddit • {getTimeAgo(post.created_utc)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SocialMediaFeed() {
  const { data, isLoading, error } = useRecentPosts()

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-sm font-medium">Failed to load posts</p>
          <p className="text-xs mt-1">Please refresh</p>
        </div>
      </div>
    )
  }

  if (!data?.posts || data.posts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-sm font-medium">No recent posts</p>
          <p className="text-xs mt-1">Check back later</p>
        </div>
      </div>
    )
  }

  // Duplicate posts to create seamless loop
  const posts = [...data.posts, ...data.posts]

  return (
    <div className="h-full overflow-hidden relative group">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
      
      <div className="animate-scroll-posts group-hover:[animation-play-state:paused]">
        {posts.map((post, index) => (
          <PostCard key={`${post.id}-${index}`} post={post} index={index} />
        ))}
      </div>
    </div>
  )
}

