import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { initializeApp, cert, getApps } from 'npm:firebase-admin/app'
import { getMessaging } from 'npm:firebase-admin/messaging'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Create client for auth using the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 2. Authenticate the user and check if admin
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Use service role client to query profiles safely
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    let isAdmin = false;

    if (user.email === 'admin@gld2026') {
      isAdmin = true;
    } else {
      const { data: profile, error: profileError } = await adminClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileError && profile?.role === 'admin') {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      throw new Error('Forbidden: Only admins can broadcast notifications')
    }

    // 3. Parse request payload
    const { title, body } = await req.json()
    if (!title || !body) {
      throw new Error('Missing title or body in request')
    }

    // 4. Fetch all fcm_tokens
    const { data: profilesWithTokens, error: tokensError } = await adminClient
      .from('users')
      .select('fcm_token')
      .not('fcm_token', 'is', null)

    if (tokensError) {
      throw new Error('Failed to fetch fcm_tokens: ' + tokensError.message)
    }

    const tokens = profilesWithTokens
      .map(p => p.fcm_token)
      .filter(token => token && token.trim() !== '')

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No devices to notify', count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 5. Initialize Firebase Admin
    if (getApps().length === 0) {
      const projectId = Deno.env.get('FIREBASE_PROJECT_ID')
      const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')
      // Private keys usually have escaped newlines in env vars, we need to unescape them
      const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase configuration is missing in environment variables')
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    }

    // 6. Send multicast message in chunks of 500 (FCM limit)
    const messaging = getMessaging()
    const chunkSize = 500
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize)
      const message = {
        notification: { title, body },
        tokens: chunk,
      }

      const response = await messaging.sendMulticast(message)
      successCount += response.successCount
      failureCount += response.failureCount
      
      // Optional: Handle tokens that are invalid/expired to clean up the DB
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(chunk[idx]);
          }
        });
        
        // Remove failed tokens from the database
        if (failedTokens.length > 0) {
          console.log('Cleaning up', failedTokens.length, 'invalid tokens');
          await adminClient
            .from('users')
            .update({ fcm_token: null })
            .in('fcm_token', failedTokens);
        }
      }
    }

    return new Response(JSON.stringify({
      message: 'Notifications sent successfully',
      successCount,
      failureCount,
      totalTokens: tokens.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error broadcasting notification:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
