import { motion } from "framer-motion";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import Toast from "../../components/Toast";

/**
 * ShareButton Component
 * Handles share functionality with native share API and fallback to copy link
 * Shows visual feedback when link is copied
 * 
 * @param {string} postId - ID of the post
 * @param {string} title - Title of the post (for share)
 * @param {string} content - Content/description of the post (for share)
 */
const ShareButton = ({ postId, title, content, className, isReel = false }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [notification, setNotification] = useState({ message: "", type: "" });

    /**
     * Generate shareable URL for the post
     */
    const getShareUrl = () => {
        return `${window.location.origin}/${isReel ? "reels" : "post"}/${postId}`;
    };

    /**
     * Handle native share API
     * Falls back to copy link if native share is not available
     */
    const handleNativeShare = async (e) => {
        e.stopPropagation();

        const shareData = {
            title: title || "Check out this post",
            text: content ? content.substring(0, 100) + (content.length > 100 ? "..." : "") : "",
            url: getShareUrl()
        };

        // Check if native share is available
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                // User cancelled share or error occurred
                if (error.name !== 'AbortError') {
                    console.error("Share failed:", error);
                    setNotification({ message: "Share failed.", type: "error" });
                    // Fallback to copy link
                    handleCopyLink(e);
                }
            }
        } else {
            // Native share not available, show menu with copy option
            setShowMenu(!showMenu);
        }
    };

    /**
     * Copy post link to clipboard
     * Provides visual feedback on success
     */
    const handleCopyLink = async (e) => {
        e.stopPropagation();

        try {
            await navigator.clipboard.writeText(getShareUrl());
            setIsCopied(true);
            setNotification({ message: "Link copied to clipboard", type: "success" });

            // Reset copied state after 2 seconds
            setTimeout(() => {
                setIsCopied(false);
                setShowMenu(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to copy link:", error);
            setNotification({ message: "Failed to copy link.", type: "error" });
        }
    };

    /**
     * Close menu when clicking outside
     */
    const handleBlur = () => {
        setTimeout(() => setShowMenu(false), 200);
    };

    return (
        <div className={`relative flex ${className}`}>
            <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNativeShare}
                onBlur={handleBlur}
                className="group"
                aria-label="Share post"
            >
                {isCopied ? (
                    <Check className="w-6 h-6 text-green-500 dark:text-green-400 transition-colors" />
                ) : (
                    <Share2 className="w-6 h-6 text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" />
                )}
            </motion.button>

            {/* Share menu - shown when native share is not available */}
            {showMenu && !isCopied && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 right-0 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-2 px-3 z-10 whitespace-nowrap"
                >
                    <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <LinkIcon className="w-4 h-4" />
                        <span>Copy link</span>
                    </button>
                </motion.div>
            )}

            <Toast
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ message: "", type: "" })}
            />
        </div>
    );
};

export default ShareButton;
