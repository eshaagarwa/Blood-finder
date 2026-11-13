export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyTier = 'Critical' | 'Urgent' | 'Planned';

export type NavScreen = 'request' | 'matching' | 'admin' | 'donors' | 'hospitals';

export type DonorResponseStatus =
  | 'Standby'
  | 'Pinged'
  | 'Confirmed'
  | 'En Route'
  | 'Delivered';

export type RequestStatus =
  | 'Dispatching'
  | 'Matching'
  | 'Donor En Route'
  | 'Fulfilled';

export interface HospitalHub {
  id: string;
  name: string;
  shortName: string;
  city: string;
  sector: string;
  licenseId: string;
  verified: boolean;
  traumaLevel: string;
  contactPhone: string;
  ambulanceBridgeReady: boolean;
  lat: number;
  lng: number;
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  phone: string;
  city: string;
  locality: string;
  age: number;
  weightKg: number;
  lastDonatedDate: string;
  donationsCount: number;
  eligibility: 'Eligible' | 'Cooldown';
  verified: boolean;
  lat: number;
  lng: number;
  responseStatus: DonorResponseStatus;
}

export interface PatientDetails {
  patientRef: string;
  ageGender: string;
  wardUnit: string;
  doctorName: string;
  indication: string;
}

export interface EmergencyRequest {
  id: string;
  hospitalId: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  unitsFulfilled: number;
  urgency: UrgencyTier;
  status: RequestStatus;
  createdAt: string;
  patientDetails?: PatientDetails;
  matchedDonorIds: string[];
  alertLog: string[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'alert' | 'info';
}
