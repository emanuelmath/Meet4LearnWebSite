import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AccessToken } from "npm:livekit-server-sdk@1.2.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('LIVEKIT_API_KEY')
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET')

    if (!apiKey || !apiSecret) {
      console.error("Faltan las llaves API KEY o SECRET en Supabase.")
      throw new Error("Error de configuración del servidor (Keys missing.)")
    }

    const { roomName, participantName } = await req.json()

    if (!roomName || !participantName) {
      throw new Error("Faltan datos: roomName o participantName")
    }

    const at = new AccessToken(apiKey, apiSecret, { identity: participantName })

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    })

    const token = at.toJwt()

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Error en la función:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})