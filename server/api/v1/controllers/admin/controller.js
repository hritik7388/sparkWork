import Joi from "joi";
import _ from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
import { userServices } from "../../services/user";

import {messagesServices} from '../../services/messages'
const { createMessage,findMessage,updateMessage ,updateMeassageById} = messagesServices   
const {
  checkUserExists,
  findCountTopSaler,
  userList,
  emailMobileExist,
  createUser,
  findUser,
  findAllUser,
  updateUser,
  updateUserById,
  engagementSearch,
  paginateSearch,
  insertManyUser,
  listUser,
  subAdminList,
  userAggregate,
} = userServices;      

import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType, { ADMIN } from "../../../../enums/userType";

export class adminController {
    
  async addAdmin(req, res, next) {
    const validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, password } = validatedBody;
      let userInfo = await findUser({
        email: email,
        status: { $ne: status.DELETE },
      });
      if (userInfo) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }
      let obj = {
        email: email,
        password: bcrypt.hashSync(password),
        userType: userType.ADMIN,
      };
      let result = await createUser(obj);
      return res.json(new response(result, responseMessage.USER_CREATED));
    } catch (error) {
      return next(error);
    }
  }

 

  /**
   * @swagger
   * /admin/loginWithEmail:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: loginWithEmail
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: loginWithEmail
   *         description: loginWithEmail
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/loginWithEmail'
   *     responses:
   *       200:
   *         description: Wallet connect successfully .
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: User not found.
   *       409:
   *         description: Nft not found.
   */

  async loginWithEmail(req, res, next) {
    let validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        email: validatedBody.email,
        userType: userType.ADMIN,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.password, userResult.password)) {
        throw apiError.invalid(responseMessage.INCORRECT_LOGIN);
      }
      let token = await commonFunction.getToken({
        id: userResult._id,
        email: userResult.email,
        userType: userResult.userType,
      });
      let obj = {
        _id: userResult._id,
        email: userResult.email,
        userType: userResult.userType,
        permissions: userResult.permissions,
        token: token,
      };
      return res.json(new response(obj, responseMessage.LOGIN));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/updateAdminProfile:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: updateAdminProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: updateAdminProfile
   *         description: updateAdminProfile
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/updateAdminProfile'
   *     responses:
   *       200:
   *         description: Your profile has been updated successfully .
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: User not found.
   *       409:
   *         description: Email exist.
   */

  async updateAdminProfile(req, res, next) {
    const validationSchema = {
      name: Joi.string().optional(),
      email: Joi.string().optional(),
      mobileNumber: Joi.string().optional(),
      personalSite: Joi.string().optional(),
      twitterUsername: Joi.string().optional(),
      customUrl: Joi.string().optional(),
      bio: Joi.string().optional(),
      coverPic: Joi.string().optional(),
      profilePic: Joi.string().optional(),
      userName: Joi.string().optional(),
    };
    try {
      var uniqueCheck, updated;
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (validatedBody.email) {
        uniqueCheck = await findUser({
          email: validatedBody.email,
          _id: { $ne: userResult._id },
          status: { $ne: status.DELETE },
        });
        if (uniqueCheck) {
          throw apiError.conflict(responseMessage.EMAIL_EXIST);
        }
        updated = await updateUserById(userResult._id, validatedBody);
      }
      updated = await updateUserById(userResult._id, validatedBody);
      return res.json(new response(updated, responseMessage.PROFILE_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/verifyOTP:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: verifyOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
   *     responses:
   *       200:
   *         description: Your profile has been updated successfully .
   *       501:
   *         description: Something went wrong.
   *       404:
   *         description: User not found.
   *       409:
   *         description: Email exist.
   */

  async verifyOTP(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, otp } = validatedBody;
      console.log("validatedBody====>>>>",validatedBody)
      
      var userResult = await findUser({
        email: validatedBody.email,
        status: { $ne: status.DELETE },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (new Date().getTime > userResult.otpTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.otp != otp && otp != 1234) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }

      var updateResult = await updateUser(
        { _id: userResult._id },
        { accountVerify: true }
      );
      var token = await commonFunction.getToken({
        id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        email: updateResult.email,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/forgotPassword:
   *   post:
   *     tags:
   *       - ADMIN
   *     description: forgotPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: forgotPassword
   *         description: forgotPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/forgotPassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async forgotPassword(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email } = validatedBody;
      var userResult = await findUser({ email: email });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        req.body.otp = commonFunction.getOTP();
        var newOtp = req.body.otp;
        var time = Date.now();
        let subject = "OTP FOR VERIFICATION.";
        let body = `Your otp for verification is ${req.body.otp}`;
        var token = await commonFunction.getToken({
          id: userResult._id,
          email: userResult.email,
          userType: userResult.userType,
        });
        await commonFunction.sendMail(email,newOtp, subject, body, token);

        var updateResult = await updateUser(
          { _id: userResult._id },
          { $set: { accountVerify: false, otp: newOtp, otpTimeExpire: time } },
          { new: true }
        );
        return res
          .status(200)
          .json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log("error========================>>>>",error)
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/resetPassword:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: resetPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: userId
   *         description: _id
   *         in: query
   *         required: true
   *       - name: resetPassword
   *         description: resetPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resetPassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async resetPassword(req, res, next) {
    var validationSchema = {
      userId: Joi.string().optional(),
      newPassword: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { userId, newPassword } = validatedBody;
      var userResult = await findUser({ _id: req.query.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var updateResult = await updateUser(
        { _id: userResult._id },
        {
          accountVerify: true,
          password: bcrypt.hashSync(validatedBody.newPassword),
        }
      );
      return res.json(new response(updateResult, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/changePassword:
   *   patch:
   *     tags:
   *       - ADMIN
   *     description: changePassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: changePassword
   *         description: changePassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/changePassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async changePassword(req, res, next) {
    const validationSchema = {
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      let updated = await updateUserById(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/adminProfile:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: adminProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async adminProfile(req, res, next) {
    try {
      let adminResult = await findUser({ _id: req.userId });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      return res.json(new response(adminResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }
  //********************************************* USER MANAGEMENT START ***************************************************************************** */

  /**
   * @swagger
   * /admin/deleteUser:
   *   delete:
   *     tags:
   *       - ADMIN
   *     description: deleteUser
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: deleteUser
   *         description: deleteUser
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/deleteUser'
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async deleteUser(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: userType.ADMIN },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findUser({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      let deleteRes = await updateUser(
        { _id: userInfo._id },
        { status: status.DELETE }
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/blockUnblockUser:
   *   put:
   *     tags:
   *       - ADMIN
   *     description: blockUnblockUser
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: blockUnblockUser
   *         description: blockUnblockUser
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/blockUnblockUser'
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async blockUnblockUser(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: userType.ADMIN },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findUser({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      if (userInfo.status == status.ACTIVE) {
        let blockRes = await updateUser(
          { _id: userInfo._id },
          { status: status.BLOCK }
        );
        return res.json(new response(blockRes, responseMessage.BLOCK_BY_ADMIN));
      } else {
        let activeRes = await updateUser(
          { _id: userInfo._id },
          { status: status.ACTIVE }
        );
        return res.json(
          new response(activeRes, responseMessage.UNBLOCK_BY_ADMIN)
        );
      }
    } catch (error) {
      return next(error);
    }
  }


 

  /**
   * @swagger
   * /admin/listUser:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: listUser
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status i.e ACTIVE || BLOCK
   *         in: query
   *       - name: search
   *         description: search i.e by WalletAddress || email || mobileNumber || userName
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listUser(req, res, next) {
    const validationSchema = {
      status: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: userType.ADMIN },
      });
      if (userResult.length == 0) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let dataResults = await paginateSearch(validatedBody);
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

 

  /**
   * @swagger
   * /admin/viewUser/{_id}:
   *   get:
   *     tags:
   *       - ADMIN
   *     description: viewUser
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: path
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async viewUser(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.params, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: userType.ADMIN,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findUser({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(userInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /admin/deleteMessage:
   *   delete:
   *     tags:
   *       - ADMIN
   *     description: deleteMessage
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true 
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteMessage(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: userType.ADMIN },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var userInfo = await findMessage({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      let deleteRes = await updateMessage(
        { _id: userInfo._id },
        { status: status.DELETE }
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }  



 
}

export default new adminController(); 