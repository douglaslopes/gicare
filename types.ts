export type Tab = 'schedule' | 'inventory' | 'appointments';

export enum MedCategory {
  LIVER = 'Fígado',
  EPILEPSY = 'Epilepsia'
}

export interface MedicationScheduleItem {
  id: string;
  name: string;
  category: MedCategory;
  times: string[]; // ["08:00", "20:00"]
}

export interface MedLog {
  id: string;
  medScheduleId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  taken: boolean;
  takenAt?: string; // ISO timestamp
}

export interface InventoryItem {
  id: string;
  name: string;
  currentQuantity: number;
  minThreshold: number;
  unit: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  notes?: string;
}

// Gemini Response Schema
export interface ParsedAppointment {
  title: string;
  date: string;
  time: string;
  location: string;
}
