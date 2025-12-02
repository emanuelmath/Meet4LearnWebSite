import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    });
  }

  try {
    // 1. Cliente Admin
    const supabaseAdmin: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Autenticación del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Falta token');
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Usuario inválido');

    // 3. Datos del body
    const { courseId } = await req.json();
    if (!courseId) throw new Error('Falta courseId');

    console.log(`Estudiante ${user.id} inscribiéndose en curso ${courseId}`); 

    // 4. Llamar al RPC
    const { error } = await supabaseAdmin.rpc('rpc_enroll_student', {
      p_student_id: user.id,
      p_course_id: courseId
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Inscripción exitosa." }),
      { 
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*'
        } 
      }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*' // Corregido a '*'
        } 
      }
    );
  }
});