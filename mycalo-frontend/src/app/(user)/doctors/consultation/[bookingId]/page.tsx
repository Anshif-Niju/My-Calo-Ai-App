"use client";

import { useParams } from "next/navigation";
import ConsultationRoom from "@/components/shared/ConsultationRoom";

export default function UserConsultationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  return (
    <div className="max-w-7xl mx-auto py-6">
      <ConsultationRoom bookingId={bookingId} role="user" />
    </div>
  );
}
