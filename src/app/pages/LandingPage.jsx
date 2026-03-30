import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {


    const navigate = useNavigate();
    const authStatus = useSelector((state) => state?.authStatus);

    useEffect(() => {
        if (authStatus) {
            navigate("/home");
        }
    }, [authStatus])

    return (
        <>
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center  min-h-[calc(100vh-64px)] flex flex-col justify-evenly"
                >
                    <h1 className="text-6xl sm:text-7xl md:text-8xl font-semibold text-gray-900 dark:text-white tracking-tight leading-none">
                        Connect.<br />Create.<br />Share.
                    </h1>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                        <a
                            href="/auth"
                            className="px-8 sm:px-10 py-4 text-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200"
                        >
                            Get Started
                        </a>
                        <a
                            href="/about"
                            className="px-8 sm:px-10 py-4 text-xl bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-lg font-medium transition-all duration-200"
                        >
                            Learn More
                        </a>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default LandingPage;