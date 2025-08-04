import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Upload, Folder, File, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

const GoogleDriveFloatingButton = ({ showForAdmin = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!showForAdmin) return null;

  const actions = [
    {
      icon: Cloud,
      label: 'เปิด Google Drive',
      to: '/admin/google-drive',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: Upload,
      label: 'อัพโหลดไฟล์',
      to: '/admin/google-drive?action=upload',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      icon: Folder,
      label: 'สร้างโฟลเดอร์',
      to: '/admin/google-drive?action=create-folder',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col space-y-3 mb-4"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={action.to}>
                    <Button
                      className={`${action.color} text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 whitespace-nowrap`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
          isOpen 
            ? 'bg-red-600 hover:bg-red-700 rotate-45' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Cloud className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoogleDriveFloatingButton;