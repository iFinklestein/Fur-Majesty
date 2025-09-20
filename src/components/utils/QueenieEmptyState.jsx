import React from 'react';

const EmptyState = ({ children, icon: Icon, title, message, actionButton }) => {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;