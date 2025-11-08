import { supabase } from '../config/supabaseClient.js';
import { Plan } from '../models/planModel.js';

// Obtener todos los planes.
export const getPlans = async (req, res) => {
  const { data, error } = await supabase.from('plan').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // Usamos el model para formatear.
const plans = data.map(planData => new Plan(planData));

  res.json(plans);
};

//Obtener plan por id.
export const getPlanById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('plan').select('*').eq('id', id).single();

  if(error) return res.status(404).json({ error: error.message });
  res.status(200).json(new Plan(data));
}
