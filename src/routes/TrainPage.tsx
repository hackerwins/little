import React from 'react';
import { useParams } from 'react-router-dom';

import { Gallery } from '../features/model/Gallery';

export function TrainPage() {
  const { label } = useParams();
  return (
    <div className="pt-6 px-12 py-6">
      <Gallery label={label} />
    </div>
  );
}
