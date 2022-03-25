import React from 'react';
import { useParams } from 'react-router-dom';

import { Gallery } from '../features/dataset/Gallery';

export function LabelPage() {
  const { label } = useParams();

  return (
    <div className="pt-6 px-12 py-6 h-screen overflow-y-auto">
      <Gallery label={label} />
    </div>
  );
}
