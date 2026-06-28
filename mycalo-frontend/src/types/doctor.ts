
export interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  specialization: string;
  experience: number;
  qualifications: string[];
  about: string;
  services: string[];
  consultationFee: number;
}

export interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Booking {
  _id: string;
  doctorId: string;
  doctorProfileId: {
    _id: string;
    name: string;
    profilePhoto?: string;
    specialization: string;
    consultationFee: number;
  };
  slotDate: string;
  slotDay: string;
  startTime: string;
  endTime: string;
  patientName: string;
  status: "pending_payment" | "confirmed" | "cancelled" | "completed";
}
