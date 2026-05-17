import { useState, useEffect } from 'react';

let uploads = [];
let listeners = [];

const emit = () => listeners.forEach(l => l(uploads));

export const uploadStore = {
  addUpload: (upload) => { 
    uploads = [...uploads, { ...upload, status: 'uploading' }]; 
    emit(); 
  },
  updateUpload: (id, data) => { 
    uploads = uploads.map(u => u.id === id ? { ...u, ...data } : u); 
    emit(); 
  },
  removeUpload: (id) => { 
    uploads = uploads.filter(u => u.id !== id); 
    emit(); 
  },
  clearCompleted: () => {
    uploads = uploads.filter(u => u.status !== 'complete');
    emit();
  },
  getUploads: () => uploads,
  subscribe: (listener) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }
};

export function useUploads() {
  const [state, setState] = useState(uploadStore.getUploads());
  useEffect(() => {
    const unsubscribe = uploadStore.subscribe(setState);
    return unsubscribe;
  }, []);
  return state;
}
