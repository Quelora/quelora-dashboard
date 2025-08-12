import { useState } from 'react';

const usePostModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState(null);

  const openModal = (postData = null) => {
    setCurrentPost(postData);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentPost(null);
  };

  return {
    isOpen,
    currentPost,
    openModal,
    closeModal,
    mode: currentPost?.entity ? 'edit' : 'create'
  };
};

export default usePostModal;