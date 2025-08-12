// ./src/utils/crypto.js
import CryptoJS from 'crypto-js';

// Genera una clave SHA-256 a partir de una cadena (como el cid)
export function generateKeyFromString(inputString) {
  if (!inputString || typeof inputString !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  return CryptoJS.SHA256(inputString).toString(CryptoJS.enc.Hex);
}

// Descifra un texto cifrado usando la clave proporcionada
export function decryptJSON(encryptedText, encryptionKey) {

  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Encrypted text must be a non-empty string');
    }

    // Separar IV y texto cifrado
    const [ivHex, cipherText] = encryptedText.split(':');
    if (!ivHex || !cipherText) {
      throw new Error('Invalid encrypted text format, expected iv:ciphertext');
    }

    // Convertir IV y clave a formato WordArray para CryptoJS
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const key = CryptoJS.enc.Hex.parse(encryptionKey);

    // Descifrar
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Hex.parse(cipherText) },
      key,
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error('Decryption failed, no data returned');
    }
    return JSON.parse(decryptedText);
  } catch (error) {
    throw error;
  }
}

// Cifra un objeto JSON usando la clave proporcionada
export function encryptJSON(jsonObject, encryptionKey) {
  if (!jsonObject || typeof jsonObject !== 'object') {
    throw new Error('Input must be a valid JSON object');
  }

  // Generar un IV aleatorio
  const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes = 128 bits para AES-CBC
  const key = CryptoJS.enc.Hex.parse(encryptionKey);
  const text = JSON.stringify(jsonObject);

  // Cifrar
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Combinar IV y texto cifrado en formato iv:ciphertext
  return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted.ciphertext.toString(CryptoJS.enc.Hex)}`;
}