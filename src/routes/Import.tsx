import React from 'react';

import { Camera } from '../features/dataset/Camera';

export function Import() {
  const addPhoto = (label: string, image: string) => {
    console.log(label, image);
  };

  return (
    <div className="pt-6 px-12 py-6 h-screen overflow-y-scroll">
      <Camera />
    </div>
  );
}
