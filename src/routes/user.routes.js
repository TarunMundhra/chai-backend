import {Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
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




export default router