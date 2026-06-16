import React from "react";
import { motion } from "framer-motion";
import { ANIMATIONS } from "../../utils/constants";

// Button Component
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClass = "font-semibold rounded-lg transition-all duration-200";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    ghost: "text-gray-800 hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
  };
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Badge Component
export const Badge = ({ children, variant = "primary", className = "" }) => {
  const variants = {
    primary: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Avatar Component
export const Avatar = ({ src, alt, size = "md", onClick, className = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <motion.img
      src={src}
      alt={alt}
      className={`${sizes[size]} rounded-full object-cover cursor-pointer ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    />
  );
};

// Card Component
export const Card = ({ children, className = "", onClick }) => {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 ${className}`}
      onClick={onClick}
      whileHover={{ y: -2 }}
    >
      {children}
    </motion.div>
  );
};

// Divider Component
export const Divider = ({ className = "" }) => (
  <div className={`h-px bg-gray-200 ${className}`} />
);

// Spinner Component
export const Spinner = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <motion.div
      className={`${sizes[size]} border-4 border-gray-300 border-t-blue-500 rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Modal Component
export const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  className = "",
}) => {
  const sizes = {
    sm: "w-96",
    md: "w-full max-w-md",
    lg: "w-full max-w-2xl",
    xl: "w-full max-w-4xl",
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto ${sizes[size]} ${className}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={ANIMATIONS.MODAL_ENTER}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
};

// Input Component
export const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  className = "",
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${className}`}
      {...props}
    />
  );
};

// Textarea Component
export const Textarea = ({
  placeholder = "",
  value,
  onChange,
  className = "",
  rows = 4,
  ...props
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${className}`}
      {...props}
    />
  );
};
