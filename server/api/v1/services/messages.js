
import messageModel from "../../../models/messages";
import status from '../../../enums/status';
import mongoose from "mongoose";



const messagesServices = {
    createMessage: async (insertObj) => {
      return await messageModel.create(insertObj);
    },
  
    findMessage: async (query) => {
        return await messageModel.findOne(query);
      },
  
    updateMessage: async (query, updateObj) => {
      return await messageModel.findOneAndUpdate(query, updateObj, { new: true });
    },
    updateMeassageById: async (query, updateObj) => {
        return await userModel.findByIdAndUpdate(query, updateObj, { new: true });
      },

  
}

module.exports = { messagesServices };

