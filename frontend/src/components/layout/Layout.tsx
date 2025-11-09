import { Outlet, Link, useLocation } from 'react-router-dom'
import { Map, BarChart3, Brain } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Network Map', href: '/', icon: Map },
  { name: 'AI Insights', href: '/insights', icon: Brain },
]

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Custom Sidebar */}
      <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">T</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">T-Mobile</h1>
              <p className="text-xs text-muted-foreground">Customer Happiness Index</p>
            </div>
          </div>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col space-y-1 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link key={item.name} to={item.href}>
                  <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent cursor-pointer ${
                    isActive ? 'text-pink-500' : 'text-white hover:text-sidebar-accent-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border p-4">
          <div className="text-xs text-muted-foreground">
            <p>Network Status: Online</p>
            <p>Last Updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
