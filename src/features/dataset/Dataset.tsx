import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectDataset, fetchDatasetAsync } from './datasetSlice';

export function Dataset() {
  const dataset = useAppSelector(selectDataset);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchDatasetAsync(1));
  }, [dispatch]);

  return (
    <section className="text-gray-700">
      {
        dataset?.labels.map((label, idx) => 
          <div key={idx} className="container mx-auto">
            <div className="sticky top-0 flex mt-4 bg-white">
              <span className="h-auto py-2 text-lg text-left">{`${label.name} ${label.images.length}`}</span>
            </div>
            <ul className="flex flex-wrap">
              {
                label.images.map((image, index) => (
                  <li key={index} className="flex flex-wrap w-1/3">
                    <div className="w-full p-1 md:p-2">
                      <img alt="gallery" className="object-cover object-center w-full h-full rounded-lg" src={image} />
                    </div>
                  </li>
                ))
              }
            </ul>
          </div>
        )
      }
    </section>
  );
}
