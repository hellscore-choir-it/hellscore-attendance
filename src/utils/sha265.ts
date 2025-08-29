import crypto from "crypto";

export const calculateSHA256Hash = (inputString: string) => {
  const hash = crypto.createHash("sha256");
  hash.update(inputString);
  return hash.digest("hex"); // or 'base64'
};
