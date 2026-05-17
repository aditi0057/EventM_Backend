
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const eventSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
         type: String 
    },
    type: {
        type: String, 
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    imageUrl: {
        type: String,
        required: false 
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

},
{
    timestamps: true
});

eventSchema.plugin(mongooseAggregatePaginate);
export const Event = mongoose.model('Event', eventSchema);


