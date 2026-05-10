import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export type Plan = 'free' | 'starter' | 'pro' | 'unlimited'

export function useCredits(user: User | null) {
  const [credits, setCredits] = useState<number | null>(null)
  const [plan, setPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCredits(null)
      setPlan('free')
      setLoading(false)
      return
    }

    async function fetchCredits() {
      try {
        // Fetch credits and plan in parallel
        const [creditsResult, subResult] = await Promise.all([
          supabase
            .from('user_credits')
            .select('credits_remaining')
            .eq('user_id', user!.id)
            .single(),
          supabase
            .from('user_subscriptions')
            .select('plan')
            .eq('user_id', user!.id)
            .maybeSingle(),
        ])

        if (creditsResult.error || !creditsResult.data) {
          // Provision initial credits for new user
          const { data: newData, error: insertError } = await supabase
            .from('user_credits')
            .insert([{ user_id: user!.id, credits_remaining: 3 }])
            .select('credits_remaining')
            .single()

          if (insertError) throw insertError
          setCredits(newData.credits_remaining)
        } else {
          setCredits(creditsResult.data.credits_remaining)
        }

        if (subResult.data?.plan) {
          setPlan(subResult.data.plan as Plan)
        }
      } catch (error) {
        console.error('Error fetching credits:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [user])

  const useCredit = async () => {
    if (!user || credits === null || credits <= 0) return false

    try {
      // Atomic decrement via RPC to avoid race conditions
      const { data, error } = await supabase.rpc('use_credit', {
        p_user_id: user.id,
      })

      if (error) throw error
      if (data === -1) return false // credits were 0

      setCredits(data)
      return true
    } catch (error) {
      console.error('Error using credit:', error)
      return false
    }
  }

  return { credits, plan, loading, useCredit }
}
