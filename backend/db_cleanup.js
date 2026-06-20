import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Conversation from './models/conversation.model.js';
import Message from './models/message.model.js';
import Notification from './models/notification.model.js';

const dbCleanup = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB.');

        // 1. Find the Friend AI user
        const aiUser = await User.findOne({ $or: [{ userName: 'friend_ai' }, { isAI: true }] });
        if (!aiUser) {
            console.log('ℹ️ No AI Friend accounts found in the database. Cleanup complete.');
            process.exit(0);
        }

        console.log(`🤖 Found AI Friend user: ${aiUser.userName} (${aiUser._id})`);

        // 2. Find and delete all messages involving AI Friend
        const deletedMessages = await Message.deleteMany({
            $or: [{ sender: aiUser._id }, { receiver: aiUser._id }]
        });
        console.log(`🗑️ Deleted ${deletedMessages.deletedCount} messages involving AI Friend.`);

        // 3. Find and delete all conversations involving AI Friend
        const deletedConversations = await Conversation.deleteMany({
            participants: aiUser._id
        });
        console.log(`🗑️ Deleted ${deletedConversations.deletedCount} conversations involving AI Friend.`);

        // 4. Find and delete all notifications involving AI Friend
        const deletedNotifications = await Notification.deleteMany({
            $or: [{ sender: aiUser._id }, { receiver: aiUser._id }]
        });
        console.log(`🗑️ Deleted ${deletedNotifications.deletedCount} notifications involving AI Friend.`);

        // 5. Remove AI Friend references from all users' followers and following lists
        const updatedUsers = await User.updateMany(
            {},
            {
                $pull: {
                    followers: aiUser._id,
                    following: aiUser._id,
                    blockedUsers: aiUser._id,
                    mutedUsers: aiUser._id
                }
            }
        );
        console.log(`🔄 Updated ${updatedUsers.modifiedCount} user records to pull AI Friend references.`);

        // 6. Delete the AI Friend user
        await User.findByIdAndDelete(aiUser._id);
        console.log('🗑️ Deleted AI Friend user record.');

        console.log('✅ Database cleanup completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database cleanup error:', err.message);
        process.exit(1);
    }
};

dbCleanup();
