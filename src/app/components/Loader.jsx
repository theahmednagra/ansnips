import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const Loader = () => {
  return (
    <div className='flex-grow flex items-center justify-center min-h-[calc(100vh-64px)]'>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className='flex flex-col items-center'
      >
        <Loader2 className='w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin' />
        <span className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
          Loading...
        </span>
      </motion.div>
    </div>
  )
}

export default Loader