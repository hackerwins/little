import React from 'react';

import { Toolbar } from '../features/camera/Toolbar';
import { Camera } from '../features/camera/Camera';

export function Import() {
  return (
    <div className="pt-6 px-12 py-6 h-screen overflow-y-scroll">
      <Toolbar />
      <Camera />
    </div>
  );
}
