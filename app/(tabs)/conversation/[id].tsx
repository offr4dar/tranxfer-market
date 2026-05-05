import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { Colors, Spacing } from '@/constants/theme'

interface Message {
  id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { userId } = useAuth()
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const listRef = useRef<FlatList>(null)

  const fetchMessages = useCallback(async () => {
    if (!id || !userId) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
    if (error) console.error('fetchMessages:', error.message)
    setMessages((data as Message[]) ?? [])
    setLoading(false)

    // Mark all received messages as read
    if (userId) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', id)
        .neq('sender_id', userId)
    }
  }, [id, userId])

  useEffect(() => {
    fetchMessages()

    // Real-time subscription
    const channel = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchMessages, id])

  const send = async () => {
    if (!text.trim() || !userId || sending) return
    setSending(true)
    const content = text.trim()
    setText('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: userId,
      content,
    })

    if (!error) {
      const { error: updateErr } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id)
      if (updateErr) console.error('update last_message_at:', updateErr.message)
    } else {
      console.error('send message:', error.message)
    }
    setSending(false)
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.brand} /></View>
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Conversation</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No messages yet. Say hello! 👋</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.sender_id === userId
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                {item.content}
              </Text>
              <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                {timeLabel(item.created_at)}
              </Text>
            </View>
          )
        }}
      />

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color={Colors.background} size="small" />
            : <Text style={styles.sendIcon}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nav: {
    paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn:   { minWidth: 60 },
  backText:  { color: Colors.brand, fontSize: 16 },
  navTitle:  { color: Colors.text, fontSize: 16, fontWeight: '600' },
  messageList: { padding: Spacing.md, gap: 8, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    gap: 4,
  },
  bubbleMine:   { alignSelf: 'flex-end', backgroundColor: Colors.brand, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText:     { color: Colors.text, fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: Colors.background },
  bubbleTime:     { color: 'rgba(255,255,255,0.4)', fontSize: 11, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(0,0,0,0.45)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1,
    borderColor: Colors.border, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 12,
    color: Colors.text, fontSize: 15, maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: Colors.background, fontSize: 18, fontWeight: '700' },
})
