import { supabase } from '../config/supabaseClient.js';
import { Plan } from '../models/planModel.js';

export const getPlans = async (req, res) => {
  const { data, error } = await supabase.from('plan').select('*');
  if (error) return res.status(500).json({ error: error.message });

  // Usamos el model para formatear.
const plans = data.map(planData => new Plan(planData));

  res.json(plans);
};
