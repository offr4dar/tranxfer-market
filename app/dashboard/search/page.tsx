import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchResults } from '@/components/search/SearchResults'
import { Search } from 'lucide-react'

export const metadata = {
  title: 'Search Players',
}

interface SearchPageProps {
  searchParams: {
    position?: string
    nationality?: string
    ageMin?: string
    ageMax?: string
    availability?: string
    leagueLevel?: string
    preferredFoot?: string
    page?: string
    q?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const page = Number(searchParams.page ?? 1)

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Search className="w-6 h-6 text-[#00FF87]" />
          Search Players
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Find your next signing from our verified player database
        </p>
      </div>

      {/* Quick search bar */}
      <div className="mb-6">
        <form method="GET" action="/dashboard/search">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search by name..."
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#00FF87]/50 transition-colors"
            />
          </div>
        </form>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <SearchFilters currentFilters={searchParams} />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-72 rounded-xl bg-white/5 animate-pulse border border-white/5"
                  />
                ))}
              </div>
            }
          >
            <SearchResults filters={searchParams} page={page} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
