/**
 * @file src/features/agreement/services/cloudinary.utils.js
 * @description Cloudinary client-side upload helper with SubtleCrypto signature signing.
 * @author Antigravity
 */

/**
 * Generate SHA-1 hash for Cloudinary signed upload
 * @param {string} string 
 * @returns {Promise<string>} Hex representation of the SHA-1 hash
 */
async function generateSHA1(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest("SHA-1", utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

/**
 * Upload signature image (Base64 string or Blob) to Cloudinary using signed API
 * @param {string|Blob} fileData Base64 image data URL or Blob
 * @returns {Promise<string>} The uploaded image secure URL
 */
export async function uploadSignatureToCloudinary(fileData) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary configuration missing in frontend environment variables.");
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "housybd/signatures";

    // Sort parameters alphabetically to construct the signature payload
    // Parameters to sign: folder, timestamp
    const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret.trim()}`;
    const signature = await generateSHA1(signatureString);

    const formData = new FormData();
    formData.append("file", fileData);
    formData.append("api_key", apiKey.trim());
    formData.append("timestamp", timestamp.toString());
    formData.append("folder", folder);
    formData.append("signature", signature);

    const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`;
    
    const response = await fetch(url, {
        method: "POST",
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
    }

    return data.secure_url;
}
