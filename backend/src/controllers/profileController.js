import { supabase } from '../config/supabaseClient.js';
import { Profile } from '../models/profileModel.js';

// Obtener todos los perfiles.
export const getProfiles = async (req, res) => {
    const { data, error } = await supabase.from('profile').select('*');
    if (error) return res.status(500).json({ error: error.message });

    const profiles = data.map(profileData => new Profile(profileData));

    res.json(profiles);
}

//Obtener docente por carnet.
export const getTeacherByCarnet = async (req, res) => {
  const { carnet } = req.params;
  const { data, error } = await supabase.from('profile').select('*').eq('carnet', carnet).single();

  if(error) return res.status(404).json({ error: error.message });
  res.status(200).json(new Profile(data));
}

// Crear un perfil.
export const createProfile = async (req, res) => {
  const { full_name, role, balance, carnet } = req.body;
  const newProfile = new Profile({
    full_name,
    role,
    balance,
    carnet,
  })


  const { data, error } = await supabase.from('profile').insert([newProfile]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};