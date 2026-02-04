import jwt from "jsonwebtoken";

export const signAccessToken = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "sharebit-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    ...options,
  });
};

export const signRefreshToken = (payload, options = {}) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || "sharebit-refresh-secret",
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
      ...options,
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || "sharebit-secret");
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || "sharebit-refresh-secret"
  );
};

export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
