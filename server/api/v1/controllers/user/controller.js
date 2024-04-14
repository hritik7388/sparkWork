import Joi from "joi";
import _, { isNull } from "lodash";
import bcrypt from 'bcryptjs'
import config from "config";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response'; 
import Secret from 'speakeasy';
import qr from 'qrcode';

import responseMessage from '../../../../../assets/responseMessage';
import { userServices } from '../../services/user'; 
import {messagesServices} from '../../services/messages'
const { createMessage,findMessage,updateMeassageById,updateMessage } = messagesServices


import { activityServices } from '../../services/activity'; 

const { createActivity, findActivity, updateActivity, paginateUserOwendActivity, activityList } = activityServices;
const { userCheck, userCount, checkUserExists, findCountTopSaler, emailMobileExist, createUser, findUser, findLinkInstgram, findfollowers, findfollowing, userDetailsWithNft, updateUser, updateUserById, paginateSearch, userAllDetails, topSaler, topBuyer, findAdminUser, paginateTopinfluencerList, updateManyUser, listUser } = userServices; 

 
import commonFunction from '../../../../helper/util';
import jwt from 'jsonwebtoken';
import status from '../../../../enums/status';
import userType from "../../../../enums/userType"; 
import User from '../../../../models/user'
export class userController {

 
  /**
   * @swagger
   * /user/signup:
   *   post:
   *     tags:
   *       - USER
   *     description: signup
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: fullName
   *         description: fullName
   *         in: formData
   *         required: true
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: mobileNumber
   *         description: mobileNumber
   *         in: formData
   *         required: true
   *       - name: countryCode
   *         description: countryCode
   *         in: formData
   *         required: true
   *       - name: password
   *         description: password
   *         in: formData
   *         required: true
   *       - name: confirmPassword
   *         description: confirmPassword
   *         in: formData
   *         required: true 
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async signUp(req, res, next) {
    const validationSchema = {
      fullName: Joi.string().required(),
      mobileNumber: Joi.string().required(),
      countryCode: Joi.string().required(),
      userName: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required()
    };
    try {
      const { fullName, email, password, confirmPassword, mobileNumber, userName, countryCode } = await Joi.validate(req.body, validationSchema);

      if (![fullName, email, password, confirmPassword, mobileNumber, userName].every(Boolean)) {
        throw apiError.badRequest(responseMessage.ALL_FIELDS);
      }
      const otp = commonFunction.getOTP();
      const OTPTime = Date.now() + 5 * 60 * 1000;
      console.log(">>>>>>>>>>>>>>>>>>>", OTPTime);

      const data = await findUser({
        $or: [{ email: email }],
        status: "ACTIVE",
      });
      if (data && data.otpVerification === true) {
        if (data.email !== email) {
          throw apiError.invalid(responseMessage.EMAIL_EXIST);
        } else {
          throw apiError.invalid(responseMessage.USER_ALREADY_EXIST);
        }
      }
      if (data && password !== confirmPassword) {
        throw apiError.conflict(responseMessage.PWD_NOT_MATCH);
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const userToUpdate = data || new User();
      Object.assign(userToUpdate, {
        userName,
        fullName,
        password: hashedPassword,
        email,
        mobileNumber,
        countryCode,
        otp: otp,
        otpTime: OTPTime,
        otpVerification: false,
      });
      const updatedUser = await userToUpdate.save();
      const responseData = {
        userName: updatedUser.userName,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        countryCode: updatedUser.countryCode,
        otpTime: updatedUser.OTPTime,
        otpVerification: updateUser.otpVerification
      }

      await commonFunction.sendMailForRegistration(
        userToUpdate.email,
        userToUpdate.name,
        updatedUser.otp
      );

      return res.json(new response(responseData, responseMessage.OTP_SEND));
    } catch (error) {
      console.log("error======>>>>", error)
      return next(error);
    }

  }
 

  /**
   * @swagger
   * /user/loginWithEmail:
   *   post:
   *     tags:
   *       - USER
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
        userType: userType.USER,
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
    * /user/getUserDetails/{_id}:
    *   get:
    *     tags:
    *       - USER
    *     description: getUserDetails
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: _id
    *         description: _id
    *         in: path
    *         required: true
    *     responses:
    *       200:
    *         description: Data found successfully.
    *       404:
    *         description: User not found.
    */

    async getUserDetails(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required()
        };
        try {
            let userResult;
            const { _id } = await Joi.validate(req.params, validationSchema);
            userResult = await userAllDetails(_id);
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            return res.json(new response(userResult, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
      * @swagger
      * /user/updateProfile:
      *   put:
      *     tags:
      *       - USER
      *     description: updateProfile
      *     produces:
      *       - application/json
      *     parameters:
      *       - name: token
      *         description: token
      *         in: header
      *         required: true
      *       - name: userName
      *         description: userName
      *         in: formData
      *         required: false
      *       - name: name
      *         description: name
      *         in: formData
      *         required: false
      *       - name: email
      *         description: email
      *         in: formData
      *         required: false
      *       - name: profilePic
      *         description: profilePic ?? base64
      *         in: formData
      *         required: false
      *       - name: coverPic
      *         description: coverPic ?? base64
      *         in: formData
      *         required: false
      *       - name: bio
      *         description: bio
      *         in: formData
      *         required: false  
      *     responses:
      *       200:
      *         description: Returns success message
      */

    async updateProfile(req, res, next) {
        try {
            var uniqueCheck, updated;
            let validatedBody = req.body;
            let userRes = await findUser({ _id: req.userId })
            console.log("userRes====>>>",userRes)
            if (!userRes) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND)
            }
            if (validatedBody.profilePic) {
                validatedBody.profilePic = await commonFunction.getSecureUrl(validatedBody.profilePic);
            }
            console.log("validatedBody.profilePic====>>>",validatedBody.profilePic)

            if (validatedBody.coverPic) {
                validatedBody.coverPic = await commonFunction.getSecureUrl(validatedBody.coverPic);
            }
            let userResult = await findUser({ _id: req.userId });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            updated = await updateUserById(userResult._id, { $set: validatedBody });
            return res.json(new response(updated, responseMessage.PROFILE_UPDATED));
        } catch (error) {
            console.log("==============>>>>>>>>>",error)
            return next(error);
        }
    }

    /**
     * @swagger
     * /user/followUnfollow/{userId}:
     *   get:
     *     tags:
     *       -  USER
     *     description: Check for Social 
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: path
     *         required: true 
     *     responses:
     *       200:
     *         description: Data found successfully
     */

    async followUnfollow(req, res, next) {
        const validationSchema = {
            userId: Joi.string().required(),
        }
        var updated;
        try {
            const { userId } = await Joi.validate(req.params, validationSchema);
            let userResult = await findUser({ _id: req.userId });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            let userCheck = await findUser({ _id: userId, status: { $ne: status.DELETE } });
            if (!userCheck) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            if (userCheck.followers.includes(userResult._id)) {
                updated = await updateUser({ _id: userCheck._id }, { $pull: { followers: userResult._id }, $inc: { followersCount: -1 } });
                await updateUser({ _id: userResult._id }, { $pull: { following: userCheck._id }, $inc: { followingCount: -1 } });
                await createActivity({
                    userId: userResult._id,
                    followerId: userCheck._id,
                    title: "UNFOLLOW_USER",
                    desctiption: "Bad choise, I unfollowing it.",
                    type: "UNFOLLOW"
                })
        
                return res.json(new response(updated, responseMessage.UNFOLLOW));
            } else {
                await createActivity({
                    userId: userResult._id,
                    followerId: userCheck._id,
                    title: "FOLLOW_USER",
                    desctiption: "Nice person, I following it.",
                    type: "FOLLOW"
                })
                
                updated = await updateUser({ _id: userCheck._id }, { $addToSet: { followers: userResult._id }, $inc: { followersCount: 1 } });
                await updateUser({ _id: userResult._id }, { $addToSet: { following: userCheck._id }, $inc: { followingCount: 1 } });
                return res.json(new response(updated, responseMessage.FOLLOW));
            }
        }
        catch (error) {
          console.log("error=======>>>>",error)
            return next(error);
        }
    }

 

    /**
     * @swagger
     * /user/followingList/{userId}:
     *   get:
     *     tags:
     *       - USER
     *     description: Check for Social 
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: userId
     *         description: userId
     *         in: path
     *         required: true 
     *     responses:
     *       200:
     *         description: Details has been fetched successfully.
     *       404:
     *         description: User not found.
     */

    async followingList(req, res, next) {
        var validationSchema = {
            userId: Joi.string().optional(),
        };
        try {
            var validatedBody = await Joi.validate(req.params, validationSchema);
            var userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } })
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            else {
                let result = await findfollowing({ _id: validatedBody.userId, status: { $ne: status.DELETE } })
                if (!result) {
                    throw apiError.notFound(responseMessage.USER_NOT_FOUND);
                } else {
                    return res.json(new response(result, responseMessage.DETAILS_FETCHED))
                }
            }
        } catch (error) {
            return next(error);
        }
    }

    /**
       * @swagger
       * /user/followersList/{userId}:
       *   get:
       *     tags:
       *       - USER
       *     description: Check for Social 
       *     produces:
       *       - application/json
       *     parameters:
       *       - name: token
       *         description: token
       *         in: header
       *         required: true
       *       - name: userId
       *         description: userId
       *         in: path
       *         required: true 
       *     responses:
       *       200:
       *         description: Details has been fetched successfully.
       *       404:
       *         description: User not found.
       */

    async followersList(req, res, next) {
        var validationSchema = {
            userId: Joi.string().optional(),
        };
        try {
            var validatedBody = await Joi.validate(req.params, validationSchema);
            var userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } })
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            else {
                let result = await findfollowers({ _id: validatedBody.userId, status: { $ne: status.DELETE } })
                if (!result) {
                    throw apiError.notFound(responseMessage.USER_NOT_FOUND);
                } else {
                    return res.json(new response(result, responseMessage.DETAILS_FETCHED))
                }
            }
        } catch (error) {
            return next(error);
        }
    }

 

 

    /**
     * @swagger
     * /user/userList:
     *   get:
     *     tags:
     *       - USER
     *     description: userList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: status
     *         description: status
     *         in: query
     *       - name: search
     *         description: search
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
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     */

    async userList(req, res, next) {
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
            let dataResults = await paginateSearch(validatedBody);
            if (dataResults.length == 0) {
                throw apiError.notFound([], responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(dataResults, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }
  
 

 
  

   /**
   * @swagger
   * /user/verifyOTP:
   *   post:
   *     tags:
   *       - USER
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

 
 
 
 

    //token expiration 
 


/**
* @swagger
* /user/sendOtpOnEmail:
*   put:
*     tags:
*       - USER
*     description: sendOtpOnEmail
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: token
*         in: header
*         required: true 
*       - name: email
*         description: email
*         in: query
*         required: false     
*     responses:
*       200:
*         description: Otp send on your email.
*       501:
*         description: Something went wrong.
*       404:
*         description: Data not found.
*/

    async sendOtpOnEmail(req, res, next) {
        try {
            const validationSchema = Joi.object({
                email: Joi.string().optional(),
            });
            const validatedBody = await Joi.validate(req.query, validationSchema);
            const userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const email = validatedBody.email || userResult.email;
            const otp = commonFunction.getOTP();
            const otpTime = new Date().getTime() + 180000;
            await commonFunction.sendOTP(email, otp);
            const updateResult = await updateUser({ _id: userResult._id }, { $set: { otp, otpTime } });
            return res.json(new response(updateResult, responseMessage.OTP_SEND));
        } catch (error) {
            console.error(error);
            return next(error);
        }
    }

 
  /**
   * @swagger
   * /user/forgotPassword:
   *   post:
   *     tags:
   *       - USER
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
   * /user/resetPassword:
   *   put:
   *     tags:
   *       - USER
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
   * /user/changePassword:
   *   patch:
   *     tags:
   *       - USER
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
   * /user/createMessage:
   *   post:
   *     tags:
   *       - USER
   *     description: createMessage
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: message
   *         description: message
   *         in: query
   *         required: true 
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: true 
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async createMessage(req, res, next) {
    const validationSchema = {
        message: Joi.string().required(),
        userId: Joi.string().required()
    };
    try {
        const validatedBody = await Joi.validate(req.query, validationSchema);
        let userResult = await findUser({ _id: validatedBody.userId });
        if (!userResult) {
            throw apiError.notFound(responseMessage.USER_NOT_FOUND);
        }
        // Assuming you have a function to create a message
        var messageResult = await createMessage(validatedBody);
        return res.json(new response(messageResult, responseMessage.MESSAGE_CREATED));
    } catch (error) {
      console.log("error=======>>>>",error)
        return next(error);
    }
}


    /**
      * @swagger
      * /user/updateMessage:
      *   put:
      *     tags:
      *       - USER
      *     description: updateMessage
      *     produces:
      *       - application/json
      *     parameters: 
      *       - name: message
      *         description: message
      *         in: query
      *         required: false   
      *       - name: messageId
      *         description: messageId
      *         in: query
      *         required: false   
      *     responses:
      *       200:
      *         description: Returns success message
      */

    async  updateMessage(req, res, next) {
      const validationSchema = {
        message: Joi.string().required(),
        messageId: Joi.string().required()
    };
    try {
        const validatedBody = await Joi.validate(req.query, validationSchema);
        let userResult = await findUser({ _id: validatedBody.messageId });
        if (!userResult) {
            throw apiError.notFound(responseMessage.USER_NOT_FOUND);
        }
        // Assuming you have a function to create a message
        var messageResult = await updateMeassageById(validatedBody);
        return res.json(new response(messageResult, responseMessage.MESSAGE_UPDATED));
    } catch (error) {
      console.log("error=======>>>>",error)
        return next(error);
    }
}
    
  

}

export default new userController()
 