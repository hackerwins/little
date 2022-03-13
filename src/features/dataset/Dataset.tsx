import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { selectDataset, initDatasetAsync, fetchDatasetAsync } from './datasetSlice';

export function Dataset() {
  const dataset = useAppSelector(selectDataset);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initDatasetAsync());
    dispatch(fetchDatasetAsync(1));
  }, [dispatch]);

  return (
    <section className="h-screen overflow-y-auto text-gray-700">
      {
        dataset?.labels.map((label, idx) => 
          <div key={idx} className="container pt-6 px-12 py-6 mx-auto">
            <div className="sticky top-0 flex mt-4 bg-white">
              <span className="h-auto py-2 text-lg text-left">{`${label.name} ${label.images.length}`}</span>
            </div>
            <ul className="flex flex-wrap -m-1 md:-m-2">
              {
                label.images.map((image, index) => (
                  <li key={index} className="flex flex-wrap w-1/3">
                    <div className="w-full p-1 md:p-2">
                      <img alt="gallery" className="block object-cover object-center w-full h-full rounded-lg" src={image} />
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
