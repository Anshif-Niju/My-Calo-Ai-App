export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"user" | "doctor" | "subadmin" | "admin">;
  requireOnboarding?: boolean;
}
