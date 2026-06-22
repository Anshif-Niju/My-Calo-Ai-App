import { asyncHandler } from "../../utils/asyncHandler";
import { AuthUserPayload } from "../../types";
import { setAccessTokenCookie, clearAuthCookies } from "../auth/auth.cookies";
import * as settingsService from "./settings.service";

// Update Profile (Settings)
export const updateProfile = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  
  try {
    const { newAccessToken, updatedUser } = await settingsService.updateProfileService(authUser.userId, req.file, req.body);

    setAccessTokenCookie(res, newAccessToken);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    throw error;
  }
});

// Delete Account
export const deleteAccount = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  
  try {
    await settingsService.deleteAccountService(authUser.userId);

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Account and all associated logs deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    throw error;
  }
});
