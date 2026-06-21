"use client";

import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

interface UserDetailsProps {
  userId: string;
}

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profilePhoto?: string;
  isBlocked: boolean;
  isDeleted: boolean;
  isEmailVerified: boolean;
  isTwofactorEnabled?: boolean;

  healthProfile?: {
    height?: number;
    weight?: number;
    goal?: string;
    activityLevel?: string;
    diseases?: string[];
  };
}

export default function UserDetails({ userId }: UserDetailsProps) {
  const { data, isLoading, isError } = useQuery<IUser>({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      console.log(res.data)
      return res.data.user;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-900 font-medium">Loading user details...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-red-500 font-medium">Failed to load user.</p>
      </div>
    );
  }

  const user = data as IUser;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">User Details</h1>
        <p className="text-slate-400 text-[11px] mt-1.5 font-bold uppercase tracking-wider">Complete user information</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {user.profilePhoto ? (
            <Image src={user.profilePhoto} alt={user.name} width={80} height={80} className="rounded-full shadow-sm" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-950 text-white flex items-center justify-center text-3xl font-bold shadow-sm">{user.name?.charAt(0).toUpperCase()}</div>
          )}

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 font-medium">{user.email}</p>

            <div className="flex justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide">{user.role}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${user.isBlocked ? "bg-red-50 text-red-600 border border-red-100/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"}`}>{user.isBlocked ? "Blocked" : "Active"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-5">Account Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">User ID</p>
            <p className="text-slate-900 font-semibold break-all">{user._id}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
            <p className="text-slate-900 font-semibold capitalize">{user.role}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Verified</p>
            <p className="text-slate-900 font-semibold">{user.isEmailVerified ? "Yes" : "No"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Two Factor Auth</p>
            <p className="text-slate-900 font-semibold">{user.isTwofactorEnabled ? "Enabled" : "Disabled"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined</p>
            <p className="text-slate-900 font-semibold">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Health Information Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-5">Health Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Height</p>
            <p className="text-slate-900 font-semibold">{user.healthProfile?.height ? `${user.healthProfile.height} cm` : "-"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
            <p className="text-slate-900 font-semibold">{user.healthProfile?.weight ? `${user.healthProfile.weight} kg` : "-"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Goal</p>
            <p className="text-slate-900 font-semibold capitalize">{user.healthProfile?.goal?.replace('_', ' ') ?? "-"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Level</p>
            <p className="text-slate-900 font-semibold capitalize">{user.healthProfile?.activityLevel ?? "-"}</p>
          </div>
        </div>
      </div>

      {/* Diseases & Conditions Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Diseases & Conditions</h3>

        {user.healthProfile?.diseases?.length ? (
          <div className="flex flex-wrap gap-2">
            {user.healthProfile.diseases.map((disease: string) => (
              <span key={disease} className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-100/50 rounded-lg text-sm font-bold capitalize animate-pulse-subtle">
                {disease}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 font-medium">No diseases recorded</p>
        )}
      </div>
    </div>
  );
}
