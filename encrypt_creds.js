import CommonUtils from "./cryptoHelper.js";

const crypto = new CommonUtils();



console.log("--- Encrypted Credentials ---");
console.log("ENCRYPTED_USERNAME=" + crypto.encryptKey(plainUsername));
console.log("ENCRYPTED_PASSWORD=" + crypto.encryptKey(plainPassword));
