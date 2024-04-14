import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';



export default Express.Router()

    .post('/addStaticContent', controller.addStaticContent)
    .get('/viewStaticContent', controller.viewStaticContent)
    .put('/editStaticContent', controller.editStaticContent)
    .get('/staticContentList', controller.staticContentList) 




    .use(upload.uploadFile) 

    
    .use(auth.verifyToken) 
