import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { logger } from "./logger.config.js";

const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPOFgWY3Fy2VFl\nZULdBPiq1qI2YbHfHjBvWIGhWPBnrmk7cfJnSgAY0Zz3kTr9cQARO90+6u/XPYu9\nRQrpNUySDJ39D1blGwmg6wLBi7rNiorqvXQJJheujivXsZzMpvT0MyB6XPUhSU+M\nMJwvm3WxvMny4k7sreVzi14x2gfwBsLabMSFdipkVFZITzyWKSSig5/dcrPpJDT0\niRGTf0U6KRd6sQlRBDjE7tq4RcvUDFUvHApdrT3U47SFO9mFPAfXH+c/Sy+KyTmx\nSc2y/tpcEJF1ajfb6Tnya+1jqpSggsvZIlH9YKsVVuhBsYOhS+xcb+CWaT1exDGT\nH0rBO1BrAgMBAAECggEAXtMjzCr5cVrtGn86F7X8rQDG/ie6o6VG+M0BlPoEGQ4A\n7cj46jc80B6ru8ZjvjKFm11Po0kTM+XgGl6L3agcQAEyEumAFBtJTq/8dOEiPIiX\nhU/o137s+13nxi5q2GPWWCFFTXlYW0EW+8oKzuZO92Sy7UiOYVQ6WaN/GUTyuO0s\nOTu3uxTUEQy5E8Hdv/m7S0QIe0fV8GzjXkavchyGiTQqExmTyzS6AMUbCZIQ7V9F\n2L9aBmWt09e1NCvxW3JuADlgJ02Wk1YfvFmXBGxIV8AvFFHXD5kbXMKZakc+0YEy\nHZRuP1oZkXGJ7r8p8mLDb0F3XDFLtl/YPgw1hZgaAQKBgQDt8DaLIcYn4DD+/I5x\nmf2Sdveo2CUlH/WjexE1wO0o4O6jiwmyUXe/osI6H4S+huk7x0GamHKp2jU+Qyr3\nj0WAtigKqzhl+Sxsdl0zzUvIRKvT5Cn7aQfEmzkBMlr6dU6cDGL3Ui5NlrY91LHA\nSVOfCeUT8J0kVKFXVy6v1ltBgQKBgQDe8zE/ddkGYCSNU2kYrsTAGnIrtjz4V47t\nKQF22Y23tZV0Z0P8+BEL+iWylc7pFB0dDxnWNOswjcxHRqYMQRVMBMl9aUrR5GhP\n5eAgbWWFgA9E6akrCiyrxLfqMAq9c2/XPSWv9s6noHBA/AWc6ufYh7/Aqm9yaowq\npVc7Ey+v6wKBgQCFiXRDH6BjjspQwRN8pE0Q313dT/mA3W/x4UbmYTF46Mxl0smN\nX3WSgtj43+mTOIo7d3fVOMvZkdKh7/Z0W99I/nJ4kmGjsXWCJefnA8gNTKUW1Y3O\nQMMQT4Ftr4Ip4J5OrBD69w9vki8TgoSEA2M/9cCwMTEwS6MFLrPQEcDDgQKBgQCg\nIyvPejU9GBeJD01gtj+KADTbYtVeR33YqOhtVowtVRcZegbij8emw7EKGgJ5dcIH\nmk4jhvUbde4xj/Q6vxCt/o4/Lz7XjejC4sleYVVXU4kkJXUl/fPiGLVFV+aO93hw\nsHH+dxcuXdXjR2I8uJl49OBtYb4U/6TYCNSkEP7iqwKBgEGxSGdOWoHgt5UQEqSk\n1t9qVUrZ3+lJdYoGRpvtoQl/29fvsszIiHlah56ezFeDmi/eE1VgvGJpjJRkr5Mv\nXW0lDVgv2xNba+BkP0zXOWNMvS1y8vsEpRmwEjh/MnIlF2DUqapMj1WikAzYjgQt\nMOyhW5PHqptpr2VmK+0cD90b\n-----END PRIVATE KEY-----\n";

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "dragowar-7fb2c",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "fdc6cf407a976328794b617e288970ae27838ece",
  private_key: rawPrivateKey.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@dragowar-7fb2c.iam.gserviceaccount.com",
  client_id: process.env.FIREBASE_CLIENT_ID || "115818179749814680860",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40dragowar-7fb2c.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

let app;
if (!getApps().length) {
  try {
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    logger.info("Firebase Admin initialized successfully ✅");
  } catch (error) {
    logger.error("Firebase Admin initialization failed ❌:", error);
  }
} else {
  app = getApps()[0];
}

export const firebaseAuth = getAuth(app);
