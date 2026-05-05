import CryptoJS from "crypto-js";

export default class CommonUtils {
	constructor() {
		if (process.env.SECRET_KEY) {
			this.SECRET_KEY = process.env.SECRET_KEY;
		} else {
			throw new Error("Please provide Secret Key while Starting the Execution");
		}
	}

	encryptKey(data) {
		const encryptedData = CryptoJS.AES.encrypt(data, this.SECRET_KEY).toString();
		console.log(encryptedData);
		return encryptedData;
	}

	decryptKey(encryptData) {
		const decryptedData = CryptoJS.AES.decrypt(
			encryptData,
			this.SECRET_KEY,
		).toString(CryptoJS.enc.Utf8);
		return decryptedData;
	}
}
