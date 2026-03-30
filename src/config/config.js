let config = {
    appwriteEndpoint: String(import.meta.env.VITE_APPWRITE_ENDPOINT),
    appwriteProjectName: String(import.meta.env.VITE_APWRITE_PROJECT_NAME),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDatabaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),

    appwriteUsersCollectionId: String(import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID),
    appwritePostsCollectionId: String(import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID),
    appwriteChatSessionsCollectionId: String(import.meta.env.VITE_APPWRITE_CHAT_SESSIONS_COLLECTION_ID),
    appwriteLikesCollectionId: String(import.meta.env.VITE_APPWRITE_LIKES_COLLECTION_ID),
    appwriteCommentsCollectionId: String(import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID),
    appwriteSavesCollectionId: String(import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID),
    appwriteFollowersCollectionId: String(import.meta.env.VITE_APPWRITE_FOLLOWERS_COLLECTION_ID),
    appwriteChatRoomsCollectionId: String(import.meta.env.VITE_APPWRITE_CHATROOMS_COLLECTION_ID),
    appwriteMessagesCollectionId: String(import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID),
    appwriteNotificationsCollectionId: String(import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID),
    appwriteCommentLikesCollectionId: String(import.meta.env.VITE_APPWRITE_COMMENT_LIKES_COLLECTION_ID),
    appwriteReelsCollectionId: String(import.meta.env.VITE_APPWRITE_REELS_COLLECTION_ID),

    groqApiKey: String(import.meta.env.VITE_GROQ_API_KEY),

    cloudinaryCloudName: String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME),
    cloudinaryUploadPreset: String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET),
    cloudinaryApiKey: String(import.meta.env.VITE_CLOUDINARY_API_KEY),
    cloudinaryApiSecret: String(import.meta.env.VITE_CLOUDINARY_API_SECRET),

    emailjsPublicKey: String(import.meta.env.VITE_EMAILJS_PUBLIC_KEY),
    emailjsServiceID: String(import.meta.env.VITE_EMAILJS_SERVICE_ID),
    emailjsTemplateId: String(import.meta.env.VITE_EMAILJS_TEMPLATE_ID),
}

export default config

