import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
const options = {
    collection: "messages",
    timestamps: true
};

const schemaDefination = new Schema(
    { 
        userId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "BLOCK", "DELETE"],
        default: "ACTIVE"
    },
    },
    options
);
module.exports = Mongoose.model("messages", schemaDefination);