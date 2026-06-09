export const getRedirectPath = (user: any): string => {
  const {
    role,
    isVerified,
    onboardingCompleted,
    verificationStatus,
  } = user;

  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "subadmin") {
    return "/subadmin/dashboard";
  }

  if (!onboardingCompleted) {
    return role === "doctor"
      ? "/onboarding/doctor"
      : "/onboarding/user";
  }

  if (!isVerified) {
    return role === "doctor"
      ? "/onboarding/doctor/profile"
      : "/onboarding/user/profile";
  }

  if (role === "doctor") {
    return verificationStatus === "approved"
      ? "/doctor/dashboard"
      : "/onboarding/doctor/verification";
  }

  return "/home";
};
