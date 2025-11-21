import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
function getInitials(name) {
  try {
    const parts = name.split(' ');
    let initials = '';
    if (parts.length > 0) {
      initials += parts[0][0] || '';
    }
    if (parts.length > 1) {
      initials += parts[parts.length - 1][0] || '';
    }
    return initials.toUpperCase();
  } catch (e) {
    return "XX";
  }
}
console.log('Función "approve-teacher" inicializada.');
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }
  try {
    const { applicationId } = await req.json();
    if (!applicationId) {
      throw new Error("Se requiere 'applicationId'");
    }
    console.log(`Procesando solicitud de aprobación para: ${applicationId}`);
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: app, error: appError } = await supabaseAdmin.from('teacher_applications').select('fullName, personalEmail, status').eq('id', applicationId).single();
    if (appError) throw new Error(`Solicitud no encontrada: ${appError.message}`);
    if (app.status !== 'pending') throw new Error('Esta solicitud ya fue procesada.');
    const initials = getInitials(app.fullName);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const carnet = `${initials}-${randomNum}`;
    console.log(`Datos generados: Carnet=${carnet}, Email=${app.personalEmail}`);
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(app.personalEmail, {
      data: {
        full_name: app.fullName,
        role: 'teacher',
        carnet: carnet
      }
    });
    if (authError) {
      console.warn(`Advertencia de Auth: ${authError.message}`);
    }
    const { error: updateError } = await supabaseAdmin.from('teacher_applications').update({
      status: 'approved'
    }).eq('id', applicationId);
    if (updateError) throw updateError;
    console.log(`¡Éxito! Solicitud ${applicationId} aprobada.`);
    return new Response(JSON.stringify({
      message: "Docente aprobado e invitado. Perfil creado."
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('Error en la Edge Function:', err.message);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
