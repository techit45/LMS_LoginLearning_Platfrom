import { supabase } from "./supabaseClient";

/**
 * Upload project image to storage
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const uploadProjectImage = async (imageFile) => {
  try {
    console.log("Starting project image upload:", {
      fileName: imageFile.name,
      fileSize: imageFile.size,
    });

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Validate file
    if (!imageFile) {
      throw new Error("No image file provided");
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error("ไฟล์ต้องเป็นรูปภาพ (JPG, PNG, WebP เท่านั้น)");
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error("ขนาดไฟล์ต้องไม่เกิน 5MB");
    }

    // Generate unique filename
    const fileExt = imageFile.name.split(".").pop()?.toLowerCase();
    const fileName = `project-image-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `project-images/${fileName}`;

    console.log("Uploading image to path:", filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("course-files")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
    }

    console.log("Image upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("course-files")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("ไม่สามารถสร้าง URL สำหรับรูปภาพได้");
    }

    console.log("Public URL generated:", urlData.publicUrl);

    return {
      data: {
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error uploading project image:", error);
    return { data: null, error };
  }
};

/**
 * Delete project image from storage
 * @param {string} filePath - The file path to delete
 * @returns {Promise<{error: Error}>}
 */
export const deleteProjectImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from("course-files")
      .remove([filePath]);

    if (error) {
      console.warn(
        "Warning: Could not delete project image from storage:",
        error
      );
    }

    return { error: null };
  } catch (error) {
    console.error("Error deleting project image:", error);
    return { error };
  }
};
