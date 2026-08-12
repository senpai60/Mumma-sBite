import axios from "axios";
import { ENV_CONFIG } from "./config/env.config.js";

const testOTP = async () => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: "123456",
        route: "otp",
        numbers: "9999999999", // dummy number
      },
      {
        headers: {
          authorization: ENV_CONFIG.FAST2SMS_API_KEY,
        },
      }
    );
    console.log("SUCCESS:", response.data);
  } catch (error) {
    console.error("ERROR:");
    console.error(error.response?.data || error.message);
  }
};

testOTP();
