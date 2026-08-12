import ImageKit from "@imagekit/nodejs";
import { ENV_CONFIG } from "../config/env.config.js";

let imagekit = null;

if (
  ENV_CONFIG.IMAGEKIT_PUBLIC_KEY &&
  ENV_CONFIG.IMAGEKIT_PRIVATE_KEY &&
  ENV_CONFIG.IMAGEKIT_URL_ENDPOINT
) {
  imagekit = new ImageKit({
    publicKey: ENV_CONFIG.IMAGEKIT_PUBLIC_KEY,
    privateKey: ENV_CONFIG.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: ENV_CONFIG.IMAGEKIT_URL_ENDPOINT,
  });
}

export default imagekit;
