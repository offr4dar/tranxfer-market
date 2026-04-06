import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const role = (user?.unsafeMetadata?.role as string) ?? 'player'

  return (
    <div className="flex min-h-screen bg-[#0A0F1E]">
      <Sidebar role={role} />

      {/* Main content area */}
      <main className="flex-1 lg:pl-64 min-h-screen">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
