import {v2 as cloudinary} from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudnary = async(localFilePath) =>{
        try{
            if(!localFilePath) return null
            //upload file on cloudinary
            const response = await cloudinary.uploader.upload(
                localFilePath,{resource_type: "auto"})
            //file has been uploaded successfully
            console.log("file has been uploaded successfully",response.url);
            // fs.unlinkSync(localFilePath)
            // return response;
            // Try to delete the local file, but don't fail if it doesn't work
            
        try {
            await fs.unlink(localFilePath);
            console.log("Local file deleted successfully.");
        } catch (err) {
            console.error("Failed to delete local file:", err);
            // Don't throw here - the upload was successful
        }return response;
        }
        catch(error){
            // after avatar file is required error chatgpt

        console.error("Error during Cloudinary upload:", error);
        
        // Try to delete the local file if upload failed
        try {
            await fs.unlink(localFilePath);
            console.log("Local file deleted after upload failure.");
        } catch (err) {
            console.error("Failed to delete file after upload failure:", err);
        }
            //before avatar file is required error
            // try {
            //     await fs.unlink(localFilePath);
            //     console.log("File deleted successfully.");
            // }catch (err) {
            //     console.error("Failed to delete file:", err);
            // } //remove the locally saved temporally 
            // file as the upload operation got failed 
            // fs.unlinkSync(localFilePath)
            return null;
        }
}

export { uploadOnCloudnary }