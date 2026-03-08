import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout(): JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="transition-all duration-300 ease-in-out lg:ml-64">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
