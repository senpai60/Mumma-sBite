import { Client } from "whatsapp-web.js";
import { generate } from "qrcode-terminal";

const whatsappClient = new Client();

try {
  whatsappClient.once("ready", () => {
    console.log("Client is ready!");
  });
  whatsappClient.on("qr", (qr) => {
    generate(qr, { small: true });
  });
  whatsappClient.on("authenticated", () => {
    console.log("AUTHENTICATED");
  });
  try {
    whatsappClient.initialize();
  } catch (err) {
    console.log(err);
  }
} catch (error) {
  console.log(error);
}

export default whatsappClient;
