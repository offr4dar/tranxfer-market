import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = {
  title: 'Messages',
}

export default async function MessagesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServerClient()

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      messages(body, sent_at, status)
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[#00FF87]" />
          Messages
        </h1>
        <p className="text-white/50 text-sm mt-1">Your conversations</p>
      </div>

      {conversations && conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((convo) => {
            const lastMsg = convo.messages?.[0]
            return (
              <div
                key={convo.id}
                className="glass-card p-4 rounded-xl border border-white/5 hover-green cursor-pointer flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-full bg-white/10 shrink-0 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-white text-sm">Conversation</h3>
                    {convo.last_message_at && (
                      <span className="text-white/30 text-xs">
                        {formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-sm truncate">
                    {lastMsg?.body ?? 'No messages yet'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
            <MessageSquare className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-white font-semibold mb-2">No messages yet</h3>
          <p className="text-white/40 text-sm max-w-xs mx-auto">
            Messages from clubs and players will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
