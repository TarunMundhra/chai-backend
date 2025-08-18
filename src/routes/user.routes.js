import {Router } from "express";
import { 
    changePassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getwatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateaccount, 
    updateUserAvatar, 
    updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";
import { verify } from "jsonwebtoken";
const router =  Router()

router.use((req, res, next) => {
  console.log(`Incoming request to user route: ${req.method} ${req.url}`);
  next();
});

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1
        },{
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)


router.route("/login").post( loginUser )


//secured routes
router.route("/logout").post(verifyJWT , logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changePassword)
router.route("/getCurrentUser").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateaccount)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT, getwatchHistory)

export default router