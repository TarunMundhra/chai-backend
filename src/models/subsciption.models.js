import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    subcriber: {
        type: mongoose.Schema.Types.ObjectId, // one who subscribes
        ref: 'User',
        required: true
    },
    channel : {
        type: mongoose.Schema.Types.ObjectId,//one to whom the subscription is made
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;