import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PatientRecord, Gender, DiseaseCategory } from '../types';

// Environment variables for Supabase in Vite
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  (import.meta.env as Record<string, string | undefined>).SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (import.meta.env as Record<string, string | undefined>).SUPABASE_ANON_KEY || 
  '';

// Check if credentials are properly configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-key') &&
    supabaseUrl.startsWith('https://')
  );
};

// Supabase client instance
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export interface SupabasePatientRow {
  id: string;
  medical_record_number: string;
  full_name: string;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  diagnosis?: string | null;
  admission_date?: string | null;
  discharge_date?: string | null;
  primary_category?: string | null;
  specific_diagnosis?: string | null;
  secondary_diagnosis?: string | null;
  doctor_in_charge?: string | null;
  liver_labs?: Record<string, unknown> | null;
  ibd_labs?: Record<string, unknown> | null;
  ibs_labs?: Record<string, unknown> | null;
  treatment_notes?: string | null;
  medications?: string[] | null;
  dietary_plan?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  visits?: unknown[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Maps frontend PatientRecord to Supabase database row format
 */
export function patientRecordToSupabaseRow(p: PatientRecord): SupabasePatientRow {
  const currentYear = new Date().getFullYear();
  const estimatedBirthYear = p.age ? currentYear - p.age : 1980;
  const dob = `${estimatedBirthYear}-01-01`;

  return {
    id: p.id,
    medical_record_number: p.patientCode || p.id,
    full_name: p.fullName,
    date_of_birth: dob,
    age: p.age,
    gender: p.gender,
    phone: p.phone || null,
    address: p.address || null,
    diagnosis: p.specificDiagnosis || p.primaryCategory || 'Chưa phân loại',
    admission_date: p.admissionDate || new Date().toISOString().split('T')[0],
    discharge_date: p.followUpDate || null,
    primary_category: p.primaryCategory,
    specific_diagnosis: p.specificDiagnosis,
    secondary_diagnosis: p.secondaryDiagnosis || null,
    doctor_in_charge: p.doctorInCharge || 'Bác sĩ Đỗ Trung Hiếu',
    liver_labs: (p.liverLabs as Record<string, unknown>) || {},
    ibd_labs: (p.ibdLabs as Record<string, unknown>) || {},
    ibs_labs: (p.ibsLabs as Record<string, unknown>) || {},
    treatment_notes: p.treatmentNotes || null,
    medications: p.medications || [],
    dietary_plan: p.dietaryPlan || null,
    follow_up_date: p.followUpDate || null,
    notes: p.notes || null,
    visits: p.visits || [],
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  };
}

/**
 * Maps Supabase database row format to frontend PatientRecord
 */
export function supabaseRowToPatientRecord(row: SupabasePatientRow): PatientRecord {
  let age = row.age || 40;
  if (!row.age && row.date_of_birth) {
    const birthYear = new Date(row.date_of_birth).getFullYear();
    const currentYear = new Date().getFullYear();
    if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
      age = currentYear - birthYear;
    }
  }

  const primaryCategory = (row.primary_category as DiseaseCategory) || 'liver';
  const gender = (row.gender as Gender) || 'male';

  return {
    id: row.id,
    patientCode: row.medical_record_number || `BN-${row.id.slice(0, 6)}`,
    fullName: row.full_name || 'Bệnh nhân',
    age: Number(age) || 40,
    gender: gender,
    phone: row.phone || undefined,
    address: row.address || undefined,
    admissionDate: row.admission_date || new Date().toISOString().split('T')[0],
    primaryCategory: primaryCategory,
    specificDiagnosis: row.specific_diagnosis || row.diagnosis || 'Chưa có chẩn đoán',
    secondaryDiagnosis: row.secondary_diagnosis || undefined,
    doctorInCharge: row.doctor_in_charge || 'Bác sĩ Đỗ Trung Hiếu',
    liverLabs: (row.liver_labs as PatientRecord['liverLabs']) || undefined,
    ibdLabs: (row.ibd_labs as PatientRecord['ibdLabs']) || undefined,
    ibsLabs: (row.ibs_labs as PatientRecord['ibsLabs']) || undefined,
    treatmentNotes: row.treatment_notes || undefined,
    medications: Array.isArray(row.medications) ? row.medications : [],
    dietaryPlan: row.dietary_plan || undefined,
    followUpDate: row.follow_up_date || row.discharge_date || undefined,
    notes: row.notes || undefined,
    visits: Array.isArray(row.visits) ? (row.visits as PatientRecord['visits']) : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * SELECT: Fetch all patients from Supabase PostgreSQL
 */
export async function fetchPatientsFromSupabase(): Promise<{ data: PatientRecord[] | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { 
      data: null, 
      error: new Error('SUPABASE_NOT_CONFIGURED') 
    };
  }

  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase SELECT error:', error);
      return { data: null, error: new Error(error.message) };
    }

    const records = (data || []).map(supabaseRowToPatientRecord);
    return { data: records, error: null };
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * INSERT: Add a new patient record to Supabase PostgreSQL
 */
export async function insertPatientToSupabase(patient: PatientRecord): Promise<{ data: PatientRecord | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { 
      data: null, 
      error: new Error('SUPABASE_NOT_CONFIGURED') 
    };
  }

  try {
    const row = patientRecordToSupabaseRow(patient);
    const { data, error } = await supabase
      .from('patients')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Supabase INSERT error:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: supabaseRowToPatientRecord(data), error: null };
  } catch (err) {
    console.error('Supabase insert exception:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * UPDATE: Update an existing patient in Supabase PostgreSQL
 */
export async function updatePatientInSupabase(patient: PatientRecord): Promise<{ data: PatientRecord | null; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { 
      data: null, 
      error: new Error('SUPABASE_NOT_CONFIGURED') 
    };
  }

  try {
    const row = patientRecordToSupabaseRow(patient);
    const { data, error } = await supabase
      .from('patients')
      .update(row)
      .eq('id', patient.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase UPDATE error:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: supabaseRowToPatientRecord(data), error: null };
  } catch (err) {
    console.error('Supabase update exception:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * DELETE: Delete a patient record from Supabase PostgreSQL
 */
export async function deletePatientFromSupabase(patientId: string): Promise<{ success: boolean; error: Error | null }> {
  if (!isSupabaseConfigured()) {
    return { 
      success: false, 
      error: new Error('SUPABASE_NOT_CONFIGURED') 
    };
  }

  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) {
      console.error('Supabase DELETE error:', error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Supabase delete exception:', err);
    return { success: false, error: err as Error };
  }
}
