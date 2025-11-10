

    

import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.SECRET_KEY || "default-secret";

export const encryptText = (text) => {
  try {
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
};



export const decryptText = (cipherText) => {
  if (!cipherText) return "";

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText;
  } catch (err) {
    console.warn("Decryption failed:", cipherText);
    return cipherText;
  }
};


export const safeDecrypt = (value) => {
  if (!value && value !== "") return "";
  if (value === "This message was deleted") return value; 
  try {
    return decryptText(value);
  } catch (err) {
    console.warn("Decryption failed, returning plain:", err.message);
    return value;
  }
};


 