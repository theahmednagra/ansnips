import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import ProfileAvatar from "./ProfileAvatar";
import LikeButton from "./post_actions/LikeButton";
import CommentButton from "./post_actions/CommentButton";
import ShareButton from "./post_actions/ShareButton";
import SaveButton from "./post_actions/SaveButton";
import LikesModal from "./LikesModal";
import CommentsSection from "./CommentsSection";
import ImageCarousel from "./ImageCarousel";
import bucketService from "../../appwrite/bucketService";
import { Play, Volume2, VolumeOff } from "lucide-react";

/**
 * Universal PostCard Component
 * Supports images, videos, autoplay, mute/unmute, carousel, and all premium actions
 */
const PostCard = ({ post, index, userDetails, showAuthor = true, onUnsave, autoplayVideo = false }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const cardRef = useRef(null);
    const contentRef = useRef(null);

    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [commentsCount, setCommentsCount] = useState(0);

    // Handle truncated content
    useEffect(() => {
        const checkTruncation = () => {
            const el = contentRef.current;
            if (el && !isExpanded) setIsTruncated(el.scrollHeight > el.clientHeight);
        };
        checkTruncation();
        window.addEventListener("resize", checkTruncation);
        return () => window.removeEventListener("resize", checkTruncation);
    }, [isExpanded, post.content]);

    // Handle image URLs
    const getImageUrls = () => {
        if (post.images && Array.isArray(post.images)) {
            return post.images.map((id) => bucketService.getFileDownload({ fileId: id }).preview);
        } else if (post.featuredImage) {
            return [bucketService.getFileDownload({ fileId: post.featuredImage }).preview];
        }
        return [];
    };
    const imageUrls = getImageUrls();

    // Navigate to post/reel page
    const handlePostClick = () => {
        if (post.videoUrl) navigate(`/reels/${post.$id}`);
        else navigate(`/post/${post.$id}`);
    };

    // Mute toggle
    const toggleMute = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    // Autoplay video when allowed and in viewport
    useEffect(() => {
        if (!autoplayVideo || !post.videoUrl) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (videoRef.current) {
                        if (entry.isIntersecting) {
                            videoRef.current.play().catch(() => { });
                            setIsPlaying(true);
                        } else {
                            videoRef.current.pause();
                            setIsPlaying(false);
                        }
                    }
                });
            },
            { threshold: 0.6 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => {
            if (cardRef.current) observer.unobserve(cardRef.current);
        };
    }, [post.videoUrl]);

    // Toggle expand/collapse content
    const handleReadMoreClick = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Handle comments
    const handleOpenComments = () => setIsCommentsOpen(true);
    const handleCloseComments = () => setIsCommentsOpen(false);

    // Save change callback
    const handleSaveChange = (isSaved) => {
        if (!isSaved && onUnsave) onUnsave(post.$id);
    };

    return (
        <>
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="bg-white dark:bg-zinc-900 mb-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={handlePostClick}
            >
                {/* Author Header */}
                {showAuthor && userDetails && (
                    <div className="p-4 pb-3 flex justify-start">
                        <Link
                            to={`/profile/${userDetails?.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-3 hover:opacity-80"
                        >
                            <ProfileAvatar profileId={post.userId} size="md" />
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {userDetails?.username}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {new Date(post.$createdAt).toLocaleDateString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric"
                                    })}
                                </p>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Media Section */}
                {imageUrls.length > 0 && (
                    <ImageCarousel images={imageUrls} alt={post.title} onImageClick={handlePostClick} />
                )}

                {post.videoUrl && (
                    <div className="relative">
                        <video
                            ref={videoRef}
                            src={post.videoUrl}
                            className="w-full h-full min-h-80 max-h-135 object-contain bg-black"
                            muted={isMuted}
                            loop
                            playsInline
                        />

                        {/* Play icon on videos when not autoplay */}
                        {!autoplayVideo && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                <div className="w-14 h-14 bg-gray-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
                                </div>
                            </div>
                        )}

                        {/* Gradient when autoplay is on */}
                        {autoplayVideo && (
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                        )}

                        {/* Mute Button when autoplay is on */}
                        {autoplayVideo && (
                            <button
                                onClick={toggleMute}
                                className='absolute top-4 right-4 z-20 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90'
                            >
                                {isMuted ? (
                                    <VolumeOff className="w-5 h-5 text-white" />
                                ) : (
                                    <Volume2 className="w-5 h-5 text-white" />
                                )}
                            </button>
                        )}
                    </div>
                )}

                <div className="px-4 py-3">
                    {/* Content */}
                    <div className="mb-2">
                        {post.title && <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{post.title}</h3>}
                        {post.content && (
                            <p
                                ref={contentRef}
                                className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line ${isExpanded ? "" : "line-clamp-2"}`}
                            >
                                {post.content}
                            </p>
                        )}
                        {(isTruncated || isExpanded) && (
                            <button
                                onClick={handleReadMoreClick}
                                className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                            >
                                {isExpanded ? "Show less" : "Read more"}
                            </button>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <LikeButton
                                post={post}
                                initialLikesCount={0}
                                whiteIcons={!!post.videoUrl}
                                onCountClick={() => setShowLikesModal(true)}
                            />
                            <CommentButton
                                postId={post.$id}
                                onClick={handleOpenComments}
                                commentsCount={commentsCount}
                                whiteIcons={!!post.videoUrl}
                            />
                            <ShareButton
                                postId={post.$id}
                                title={post.title || post.caption}
                                content={post.content || post.caption}
                                whiteIcons={!!post.videoUrl}
                                isReel={post.videoUrl}
                            />
                        </div>
                        <SaveButton
                            postId={post.$id}
                            whiteIcons={!!post.videoUrl}
                            onSaveChange={handleSaveChange}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Likes Modal */}
            <LikesModal postId={post.$id} isOpen={showLikesModal} onClose={() => setShowLikesModal(false)} />

            {/* Comments */}
            <CommentsSection
                postId={post.$id}
                postOwnerId={post.userId}
                isOpen={isCommentsOpen}
                onClose={handleCloseComments}
                onCommentCountChange={setCommentsCount}
            />
        </>
    );
};

export default PostCard;
