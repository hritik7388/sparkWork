import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()   
    .get('/userList', controller.userList) 
    .get('/getUserDetails/:_id', controller.getUserDetails) 
    .post('/signUp', controller.signUp)
    .post('/loginWithEmail', controller.loginWithEmail)
    .post('/forgotPassword', controller.forgotPassword)
    .put('/resetPassword', controller.resetPassword) 
    .post('/verifyOTP', controller.verifyOTP) 
    .post('/createMessage',controller.createMessage)



    .use(auth.verifyToken) 
    .get('/followUnfollow/:userId', controller.followUnfollow)
    .get('/followingList/:userId', controller.followingList)
    .get('/followersList/:userId', controller.followersList)   
    .put('/updateMessage',controller.updateMessage) 
    
    .put('/sendOtpOnEmail', controller.sendOtpOnEmail)
    
    .patch('/changePassword', controller.changePassword)





    .use(upload.uploadFile) 
    .put('/updateProfile', controller.updateProfile) 


