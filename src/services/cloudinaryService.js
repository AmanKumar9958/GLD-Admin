/**
 * Uploads an image to Cloudinary securely using an Unsigned Upload Preset.
 */
export async function uploadImageToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUD_NAME;
  // Bhai, yahan apne unsigned preset ka naam dalo jo Cloudinary dashboard mein banaya tha
  const uploadPreset = "gld_thumbnails";

  if (!cloudName) {
    throw new Error("Cloud name is missing from environment variables.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
  }

  // URL Optimizer jo mobile devices ka bandwidth bachayega
  const optimizeCloudinaryUrl = (rawUrl) => {
    if (!rawUrl) return "";
    const transformation = "f_auto,q_auto,w_800,h_450,c_fill";
    return rawUrl.replace("/upload/", `/upload/${transformation}/`);
  };

  // Return the highly optimized secure HTTPS URL
  return optimizeCloudinaryUrl(data.secure_url);
}