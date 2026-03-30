import Masonry from 'react-masonry-css';
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { FilePlus, Plus, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import postService from "../../appwrite/postService";
import reelsService from "../../appwrite/reelsService";   // ⬅️ NEW
import Toast from "../components/Toast";
import Loader from "../components/Loader";
import { useSelector } from 'react-redux';
import FollowButton from '../components/FollowButton';
import PostCard from '../components/PostCard';
import userInfoService from '../../appwrite/userInfoService';
import MessageUserButton from '../components/MessageUserButton';
import ProfileAvatar from '../components/ProfileAvatar';
import ProfileStats from '../components/ProfileStats';
import DropdownMenu from '../components/DropdownMenu';
import useAuth from '../../hooks/useAuth';

/**
 * AllPosts (Profile Page) - Optimized
 * Now loads BOTH posts + reels for a user
 * Fully supports infinite scroll + merged content
 */
const AllPosts = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const userData = useSelector(state => state.userData);
    const { handleLogout } = useAuth();  // For logout

    // User data
    const [userId, setUserId] = useState("");
    const [profileUser, setProfileUser] = useState(null);

    // Combined posts & reels
    const [content, setContent] = useState([]);            // ⬅️ CHANGED
    const [allContentCache, setAllContentCache] = useState([]); // ⬅️ CHANGED
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");

    // Refs
    const observerTarget = useRef(null);

    // Since masonry shows ~12 items at once, load 15 per batch
    const POSTS_LIMIT = 15;

    const isOwnProfile = userId === userData?.$id;

    // Masonry breakpoints
    const breakpointColumns = {
        default: 4,
        1280: 4,
        1024: 3,
        640: 2,
        500: 1
    };

    /**
     * Scroll to top (optional)
     */
    useEffect(() => {
        scrollTo(top);
    }, []);

    /**
     * Get user ID from username
     */
    useEffect(() => {
        const getUserId = async () => {
            try {
                const result = await userInfoService.getUserIdByUsername({ username });
                if (result.error) throw new Error(result.error);
                setUserId(result.userId);
            } catch (err) {
                setError(err.message);
            }
        };

        if (username) {
            getUserId();
        }
    }, [username]);

    /**
     * Load user profile and initial posts
     */
    useEffect(() => {
        if (userData && userId) {
            loadProfileAndContent(true);
        }
    }, [userData, userId]);

    /**
     * Load profile data + BOTH posts + reels
     */
    const loadProfileAndContent = useCallback(async (reset = false) => {
        if (!reset && !hasMore) return;

        const currentOffset = reset ? 0 : offset;
        reset ? setIsLoading(true) : setIsLoadingMore(true);

        try {
            const targetUserId = userId || userData?.$id;
            if (!targetUserId) throw new Error("User not found");

            // Load user info only on first load (caching)
            if (reset || !profileUser) {
                const { userInfo, error: userError } = await userInfoService.getUserInfo(targetUserId);
                if (userError) throw new Error(userError);
                setProfileUser(userInfo);
            }

            // Fetch POSTS
            let postResult;
            if (isOwnProfile) {
                postResult = await postService.listPosts(targetUserId);
            } else {
                postResult = await postService.listUserPublicPosts(targetUserId);
            }
            if (postResult.error) throw new Error(postResult.error);

            const fetchedPosts = postResult.posts.documents.map(p => ({
                ...p,
                _type: "post" // mark for sorting
            }));

            // Fetch REELS
            let reelResult;
            if (isOwnProfile) {
                reelResult = await reelsService.listUserReels(targetUserId);
            } else {
                reelResult = await reelsService.listUserPublicReels(targetUserId);
            }
            if (reelResult.error) throw new Error(reelResult.error);

            const fetchedReels = reelResult.reels.documents.map(r => ({
                ...r,
                _type: "reel" // mark for sorting
            }));

            // Combine & sort by createdAt DESC
            const combined = [...fetchedPosts, ...fetchedReels].sort(
                (a, b) => new Date(b.$createdAt) - new Date(a.$createdAt)
            );

            // Cache all content on first load
            if (reset) {
                setAllContentCache(combined);
            }

            // Paginate from cache
            const paginated = combined.slice(
                currentOffset,
                currentOffset + POSTS_LIMIT
            );

            // Update content
            if (reset) {
                setContent(paginated);
            } else {
                setContent(prev => [...prev, ...paginated]);
            }

            // Update pagination state
            setOffset(currentOffset + paginated.length);
            setHasMore(currentOffset + paginated.length < combined.length);
            setError("");

        } catch (err) {
            console.error("Failed to load profile:", err);
            setError(err.message || "Failed to load profile");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [userId, userData, isOwnProfile, offset, hasMore, profileUser]);

    /**
     * Infinite scroll observer
     * Loads more content when user scrolls near bottom
     */
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadProfileAndContent();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, isLoadingMore, loadProfileAndContent]);

    if (isLoading) return <Loader />;

    return (
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="max-w-4xl mx-auto">

                    {/* Profile Info Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-10">
                        <div className="flex-shrink-0 flex justify-center sm:block">
                            <ProfileAvatar
                                profileId={userId}
                                size="2xl"
                            />
                        </div>

                        <div className="flex-1 flex flex-col items-center sm:items-start">
                            <div className="flex flex-col items-center sm:items-start gap-1">
                                <h1 className="text-2xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    {profileUser.name}
                                </h1>

                                <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                    @{username}
                                </span>
                            </div>

                            {profileUser?.bio && (
                                <p className="mt-3 text-center sm:text-left text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl">
                                    {profileUser.bio}
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3">
                                {isOwnProfile ? (
                                    <>
                                        <DropdownMenu
                                            buttonContent={<span> Settings </span>}
                                            buttonClassName="px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-500 dark:border-neutral-400 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                                            options={[
                                                {
                                                    label: "Edit Profile",
                                                    onClick: () => navigate("/edit-profile"),
                                                },
                                                {
                                                    label: "Change Password",
                                                    onClick: () => navigate("/change-password"),
                                                },
                                                {
                                                    label: "Sign Out",
                                                    color: "blue",
                                                    confirmProps: {
                                                        title: "Sign Out",
                                                        message: "Are you sure you want to sign out?",
                                                        confirmText: "Sign Out",
                                                        confirmColor: "neutral",
                                                        onConfirm: handleLogout,
                                                    },
                                                },
                                            ]}
                                        />

                                        <DropdownMenu
                                            buttonContent={<span>Favorites</span>}
                                            buttonClassName="px-4 py-2 text-sm font-semibold rounded-xl border border-neutral-500 dark:border-neutral-400 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                                            options={[
                                                {
                                                    label: "Saved Posts",
                                                    onClick: () => navigate("/saved-posts"),
                                                },
                                                {
                                                    label: "Liked Posts",
                                                    onClick: () => navigate("/liked-posts"),
                                                },
                                            ]}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <FollowButton targetUserId={userId} />

                                        <MessageUserButton recipientUserId={userId} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-6">
                        <ProfileStats
                            username={username}
                            postsCount={allContentCache.length || content.length}
                        />
                    </div>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 mb-6"></div>

                {/* Posts Header */}
                <div className='flex justify-between items-center mb-6'>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isOwnProfile ? 'Your Posts' : 'Posts'}
                    </h2>

                    {isOwnProfile && (
                        <button
                            onClick={() => navigate("/postform")}
                            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                            New Post
                        </button>
                    )}
                </div>

                {/* Posts Grid */}
                {content.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                            {isOwnProfile
                                ? "You haven't shared any posts or reels yet."
                                : "This user hasn't shared anything yet."}
                        </p>

                        {isOwnProfile && (
                            <button
                                onClick={() => navigate("/postform")}
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                            >
                                <Plus size={16} />
                                Create Your First Post
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Masonry Grid */}
                        <Masonry
                            breakpointCols={breakpointColumns}
                            className="flex -ml-4 w-auto"
                            columnClassName="pl-4 bg-clip-padding"
                        >
                            {content.map((item, index) => (
                                <PostCard
                                    key={item.$id}
                                    post={item}
                                    index={index}
                                    userInfo={profileUser}
                                    showAuthor={false}
                                />
                            ))}
                        </Masonry>

                        {/* Infinite Scroll Trigger */}
                        <div ref={observerTarget} className="py-8">
                            {isLoadingMore && (
                                <div className="flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                </div>
                            )}
                        </div>

                        {/* End of List */}
                        {!hasMore && content.length > 0 && (
                            <div className="text-center text-sm font-medium py-8 text-gray-500 dark:text-gray-400">
                                You've reached the end
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            <Toast
                message={error}
                type="error"
                onClose={() => setError("")}
            />
        </div>
    );
};

export default AllPosts;
