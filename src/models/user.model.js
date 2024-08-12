import mongoose, {Schema} from "mongoose"

const userSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //Cloudinary url
        required: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String,
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    maritalStatus: {
        type: String,
        enum: ['Single', 'Married'],
        required: true,
    },
    anniversaryDate: {
        type: Date,
        required: function () {
            return this.maritalStatus === 'Married';
        }
    },
    workJoiningDate: {
        type: Date,
        required: true,
    },

  },
  {
    timestamps: true
  }
)

export const User= mongoose.model("User",userSchema)