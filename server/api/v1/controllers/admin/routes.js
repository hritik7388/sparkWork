import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router() 
    .post('/createAdmin', controller.addAdmin) 
    .post('/loginWithEmail', controller.loginWithEmail)
    .post('/forgotPassword', controller.forgotPassword)
    .post('/verifyOTP', controller.verifyOTP)
    .put('/resetPassword', controller.resetPassword) 


    .use(auth.verifyToken)
    .get('/viewUser', controller.viewUser)
    .put('/blockUnblockUser', controller.blockUnblockUser) 
    .get('/listUser', controller.listUser) 
    
    .get('/adminProfile', controller.adminProfile)
    .delete('/deleteUser', controller.deleteUser) 
    .delete('/deleteMessage',controller.deleteMessage) 
    .patch('/changePassword', controller.changePassword)
    .put('/updateAdminProfile', controller.updateAdminProfile)  
   
 


    .use(upload.uploadFile) 


