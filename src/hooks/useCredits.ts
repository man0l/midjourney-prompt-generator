import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'

export function useCredits(user: User | null) {
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCredits(null)
      setLoading(false)
      return
    }

    async function fetchCredits() {
      try {
        // Try to get existing credits
        let { data, error } = await supabase
          .from('user_credits')
          .select('credits_remaining')
          .eq('id', user.id)
          .single()

        if (error || !data) {
          // If no credits exist, create initial credits
          const { data: newData, error: insertError } = await supabase
            .from('user_credits')
            .insert([{ id: user.id }])
            .select('credits_remaining')
            .single()

          if (insertError) throw insertError
          data = newData
        }

        setCredits(data.credits_remaining)
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [user])

  const useCredit = async () => {
    if (!user || !credits || credits <= 0) return false

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .update({ credits_remaining: credits - 1 })
        .eq('id', user.id)
        .select('credits_remaining')
        .single()

      if (error) throw error
      setCredits(data.credits_remaining)
      return true
    } catch (error) {
      console.error('Error using credit:', error)
      return false
    }
  }

  return { credits, loading, useCredit }
} 