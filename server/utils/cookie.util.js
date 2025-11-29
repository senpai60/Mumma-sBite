export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";

  // Access token cookie (short-lived)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,                    // prod me HTTPS expected
    sameSite: isProd ? "none" : "lax", // frontend alag domain ho to "none"
    maxAge: 15 * 60 * 1000,            // 15 min
  });

  // Refresh token cookie (long-lived)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
  });

};
