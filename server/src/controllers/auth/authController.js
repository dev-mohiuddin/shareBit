import {
  signIn as signInService,
  signUp as signUpService,
  verifyOtp as verifyOtpService,
  resendOtp as resendOtpService,
  refreshAccessToken as refreshAccessTokenService,
} from "#services/auth/authService.js";
import { catchAsync } from "#utils/catchAsync.js";

const getCookieMaxAge = (days, fallbackDays) => {
  const value = Number(process.env[days] || fallbackDays);
  return value * 24 * 60 * 60 * 1000;
};

const getCookieOptions = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: maxAgeMs,
});

export const signIn = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await signInService(req.body);

  res.cookie(
    "access_token",
    accessToken,
    getCookieOptions(getCookieMaxAge("ACCESS_TOKEN_COOKIE_MAX_AGE_DAYS", 7))
  );

  res.cookie(
    "refresh_token",
    refreshToken,
    getCookieOptions(getCookieMaxAge("REFRESH_TOKEN_COOKIE_MAX_AGE_DAYS", 30))
  );

  res.success({
    data: user,
    message: `Login successful. Welcome, ${user.firstName} ${user.lastName}!`,
    statusCode: 200,
  });
});

export const signUp = catchAsync(async (req, res) => {
  const { user } = await signUpService(req.body);

  res.success({
    data: user,
    message: "Registration successful. Please verify OTP.",
    statusCode: 201,
  });
});

export const verifyOtp = catchAsync(async (req, res) => {
  const { user } = await verifyOtpService(req.body);

  res.success({
    data: user,
    message: "OTP verified successfully",
    statusCode: 200,
  });
});

export const resendOtp = catchAsync(async (req, res) => {
  const result = await resendOtpService(req.body);

  res.success({
    data: result,
    message: "OTP resent successfully",
    statusCode: 200,
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const refreshTokenFromCookie = req.cookies?.refresh_token;
  const refreshTokenFromBody = req.body?.refreshToken;
  const { accessToken, refreshToken } = await refreshAccessTokenService(
    refreshTokenFromCookie || refreshTokenFromBody
  );

  res.cookie(
    "access_token",
    accessToken,
    getCookieOptions(getCookieMaxAge("ACCESS_TOKEN_COOKIE_MAX_AGE_DAYS", 7))
  );

  res.cookie(
    "refresh_token",
    refreshToken,
    getCookieOptions(getCookieMaxAge("REFRESH_TOKEN_COOKIE_MAX_AGE_DAYS", 30))
  );

  res.success({
    data: { accessToken },
    message: "Token refreshed",
    statusCode: 200,
  });
});
