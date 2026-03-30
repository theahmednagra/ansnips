import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Pause, Play, MoreVertical } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import LikeButton from './post_actions/LikeButton';
import ShareButton from './post_actions/ShareButton';
import SaveButton from './post_actions/SaveButton';
import CommentButton from './post_actions/CommentButton';
import LikesModal from './LikesModal';
import CommentsSection from './CommentsSection';
import { useSelector } from 'react-redux';
import MenuButton from './post_actions/MenuButton';
import reelsService from '../../appwrite/reelsService';

/**
 * ReelPlayer Component - Premium Version
 * Instagram/TikTok style video player with professional controls
 * Includes like, comment, share, save actions and smooth interactions
 * 
 * @param {Object} reel - Reel data object
 * @param {Object} userDetails - User details for the reel author
 * @param {boolean} isActive - Whether this reel is currently in view
 * @param {Function} onComment - Callback when comment button clicked
 */
const ReelPlayer = ({ reel, userDetails, isActive }) => {
    const videoRef = useRef(null);
    const progressBarRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const [isOwnReel, setIsOwnReel] = useState(false);
    const captionRef = useRef(null);

    const navigate = useNavigate();

    const userData = useSelector(state => state?.userData);
    useEffect(() => {
        if (reel.userId === userData?.$id) {
            setIsOwnReel(true)
        }
    }, [userData, reel]);

    // --- ACTION STATES (required like PostCard) ---
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [commentsCount, setCommentsCount] = useState(0);
    const [showLikesModal, setShowLikesModal] = useState(false);

    // open comments modal
    const handleOpenComments = () => setIsCommentsOpen(true);

    // close comments modal
    const handleCloseComments = () => setIsCommentsOpen(false);

    // handle comments count change (inside CommentsSection)
    const handleCommentCountChange = (newCount) => {
        setCommentsCount(newCount);
    };

    /**
     * For read more/ see less functionality
     */
    useEffect(() => {
        const checkTruncation = () => {
            const el = captionRef.current;
            if (el && !isExpanded) {
                setIsTruncated(el.scrollHeight > el.clientHeight);
            }
        };

        checkTruncation();
        window.addEventListener("resize", checkTruncation);

        return () => window.removeEventListener("resize", checkTruncation);
    }, [isExpanded, reel.content]);

    /**
     * Auto-play/pause based on visibility
     */
    useEffect(() => {
        if (!videoRef.current) return;

        if (isActive) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(err => console.error('Video play failed:', err));
            }
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [isActive]);

    /**
     * Update progress and time
     */
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            if (!isDragging) {
                const progress = (video.currentTime / video.duration) * 100;
                setProgress(progress);
                setCurrentTime(video.currentTime);
            }
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, [isDragging]);

    /**
     * Format time (MM:SS)
     */
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * Toggle mute
     */
    const toggleMute = (e) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    /**
     * Toggle play/pause
     */
    const togglePlayPause = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.error('Video play failed:', err));
        }

        // Show play/pause icon
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 500);
    };

    /**
     * Handle seek bar click
     */
    const handleSeek = (e) => {
        if (!videoRef.current || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        const newTime = (percentage / 100) * duration;

        videoRef.current.currentTime = newTime;
        setProgress(percentage);
        setCurrentTime(newTime);
    };

    /**
     * Handle seek bar drag
     */
    const handleSeekStart = (e) => {
        setIsDragging(true);
        handleSeekMove(e);
    };

    const handleSeekMove = (e) => {
        if (!isDragging && e.type !== 'mousedown') return;
        if (!progressBarRef.current || !videoRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
        const newTime = (percentage / 100) * duration;

        setProgress(percentage);
        setCurrentTime(newTime);
    };

    const handleSeekEnd = () => {
        if (isDragging && videoRef.current) {
            videoRef.current.currentTime = currentTime;
        }
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleSeekMove);
            window.addEventListener('mouseup', handleSeekEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleSeekMove);
            window.removeEventListener('mouseup', handleSeekEnd);
        };
    }, [isDragging]);

    /**
     * Loop video when ended
     */
    const handleVideoEnded = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    };

    /**
     * Handle delete reel
     */
    const handleDelete = async () => {
        const { error } = await reelsService.deleteReel({ reelId: reel.$id, userId: reel.userId });
        if (error) return;
        navigate(-1);
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center py-2 bg-black">
            {/* Video Player */}
            <div className="relative h-full aspect-[9/16] rounded-xl overflow-hidden bg-black">
                <video
                    ref={videoRef}
                    src={reel.videoUrl}
                    className="h-full object-contain"
                    loop={false}
                    playsInline
                    muted={isMuted}
                    onEnded={handleVideoEnded}
                    onClick={togglePlayPause}
                    preload="metadata"
                />

                {/* Progress Bar */}
                <div className="w-full absolute bottom-0 left-0 right-0 flex flex-col space-y-3 z-30">
                    <div className="flex items-center justify-between px-2">
                        {/* Time Display */}
                        <div className="text-gray-200 text-xs font-medium">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>
                    <div
                        ref={progressBarRef}
                        className="relative h-0.5 bg-white/20 cursor-pointer group"
                        onClick={handleSeek}
                        onMouseDown={handleSeekStart}
                    >
                        {/* Progress */}
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-white"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="absolute bottom-16 right-2 flex flex-col items-center gap-4 z-30">
                    {/* LIKE BUTTON */}
                    <div className="flex bg-gray-400/50 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white/60 transition-colors">
                        <LikeButton
                            post={reel}
                            initialLikesCount={0}
                            onCountClick={() => setShowLikesModal(true)}
                        />
                    </div>

                    {/* COMMENT BUTTON */}
                    <div className="flex bg-gray-400/50 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white/60 transition-colors">
                        <CommentButton
                            postId={reel.$id}
                            onClick={handleOpenComments}
                            commentsCount={commentsCount}
                        />
                    </div>

                    {/* SAVE BUTTON */}
                    <div className="flex bg-gray-400/50 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white/60 transition-colors">
                        <SaveButton
                            postId={reel.$id}
                        />
                    </div>

                    {/* SHARE BUTTON */}
                    <div className="flex bg-gray-400/50 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white/60 transition-colors">
                        <ShareButton
                            postId={reel.$id}
                            title={reel.title}
                            content={reel.caption}
                            isReel={true}
                        />
                    </div>

                    {/* MORE BUTTON */}
                    {isOwnReel && (
                        <div className="flex bg-gray-400/50 backdrop-blur-md p-2 rounded-full shadow-lg hover:bg-white/60 transition-colors">
                            <MenuButton
                                postId={reel.$id}
                                ownerId={reel.userId}
                                userId={userData.$id}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 pl-2 pb-8 bg-gradient-to-t from-black/60 via-black/40 to-transparent z-20">
                    <div className="flex gap-4 max-w-[80%]">
                        {/* Left Side - User Info and Caption */}
                        <div className="flex-1 flex flex-col justify-end min-w-0">
                            {/* User Info */}
                            {userDetails && (
                                <Link
                                    to={`/profile/${userDetails.username}`}
                                    className="flex items-center gap-2 w-fit mb-2 hover:opacity-80 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ProfileAvatar
                                        profileId={reel.userId}
                                        size="sm"
                                    />
                                    <div>
                                        <span className="font-semibold text-white text-base block">
                                            {userDetails.username}
                                        </span>
                                    </div>
                                </Link>
                            )}

                            {/* Title */}
                            {reel.title && (
                                <p className="text-white/90 text-[15px] font-semibold">
                                    {reel.title}
                                </p>
                            )}

                            {/* Caption */}
                            {reel.content && (
                                <div className="mb-2 text-white/90 text-sm leading-relaxed">
                                    <p
                                        ref={captionRef}
                                        className={`whitespace-pre-line ${isExpanded ? "" : "line-clamp-2"}`}
                                    >
                                        {reel.content}
                                    </p>

                                    {(isTruncated || isExpanded) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsExpanded(!isExpanded);
                                            }}
                                            className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                                        >
                                            {isExpanded ? "See less" : "Read more"}
                                        </button>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Play/Pause Icon Animation */}
            <AnimatePresence>
                {showPlayIcon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                    >
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            {isPlaying ? (
                                <Pause className="w-12 h-12 text-white" fill="white" />
                            ) : (
                                <Play className="w-12 h-12 text-white ml-1" fill="white" />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mute Button */}
            <button
                onClick={toggleMute}
                className='absolute top-4 right-4 z-50 w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/60 transition-all shadow-lg active:scale-90'
            >
                {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                )}
            </button>

            {/* Likes modal */}
            <LikesModal
                postId={reel.$id}
                isOpen={showLikesModal}
                onClose={() => setShowLikesModal(false)}
            />

            {/* Comments Modal */}
            <CommentsSection
                postId={reel.$id}
                postOwnerId={reel.userId}
                isOpen={isCommentsOpen}
                onClose={handleCloseComments}
                onCommentCountChange={handleCommentCountChange}
            />

        </div>
    );
};

export default ReelPlayer;
