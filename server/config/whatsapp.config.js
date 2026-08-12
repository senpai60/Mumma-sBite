import wwjs from "whatsapp-web.js";
const { Client, LocalAuth } = wwjs;

import QRCode from "qrcode";
import { logger } from "./logger.config.js";

// LocalAuth persists session in .wwebjs_auth/ so you don't scan QR every restart
const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

whatsappClient.on("qr", (qr) => {
  logger.info("WhatsApp QR code received — scan with your phone:");
  QRCode.toString(qr, { type: "terminal", small: true }, (err, url) => {
    if (err) {
      console.error("Failed to render QR code:", err);
    } else {
      console.log(url);
    }
  });
});

whatsappClient.on("authenticated", () => {
  logger.info("WhatsApp client authenticated ✅");
});

whatsappClient.on("ready", () => {
  logger.info("WhatsApp client is ready 📱");
});

whatsappClient.on("auth_failure", (msg) => {
  logger.error(`WhatsApp auth failed: ${msg}`);
});

whatsappClient.on("disconnected", (reason) => {
  logger.warn(`WhatsApp client disconnected: ${reason}`);
});

// Call this once at server startup (in app.js or bin/www)
export const initWhatsapp = () => {
  whatsappClient.initialize().catch((err) => {
    logger.error(`WhatsApp initialization error: ${err.message}`);
  });
};

// Helper to send a message — used by OTP service, etc.
export const sendWhatsappMessage = async (phone, message) => {
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  const chatId = `${cleaned}@c.us`; // WhatsApp format: countrycode+number@c.us
  await whatsappClient.sendMessage(chatId, message);
  logger.info(`WhatsApp OTP message sent to +${cleaned}`);
};

export default whatsappClient;

