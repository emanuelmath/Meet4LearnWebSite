import { supabase } from "../config/supabaseClient.js";
import { Course } from "../models/courseModel.js";

// Obtener todos los cursos.
export const getAllCourses = async (req, res) => {
    const { data, error} = await supabase.from('course').select('*');

    if(error) return res.status(500).error({ error: error.message });
    const courses = data.map(course => new Course(data));
    res.json(courses);
}