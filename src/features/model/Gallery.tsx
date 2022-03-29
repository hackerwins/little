import React from 'react';

import { useAppSelector } from '../../app/hooks';
import { selectDataset } from '../dataset/datasetSlice';
import { selectModelInfo } from '../model/modelSlice';
import { LabelInput } from '../../common/label/LabelInput';

// Gallery component displays a list of images of a dataset.
export function Gallery() {
  const dataset = useAppSelector(selectDataset);
  const modelInfo = useAppSelector(selectModelInfo);
  const labels = dataset?.labels || [];
  const filteredLabels = labels.filter(l => l.images.length);

  // TODO(hackerwins): Display predictions for each image.
  console.log(modelInfo);

  return (
    <>
      <div className="flex w-full h-12">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">All Images</h1>
        </div>
      </div>
      <section>
        {
          filteredLabels.map((label, idx) => 
            <div key={idx} className="container mx-auto">
              <div className="flex mt-4 bg-white">
                <span className="h-auto py-2 text-md text-left"><b>{label.name}</b> {label.images.length}</span>
              </div>
              <ul className="flex flex-wrap">
                {
                  label.images.map((image, index) => (
                    <li key={index} className="flex flex-wrap w-1/3">
                      <div className="relative w-full p-1 md:p-2">
                        <img alt="gallery" className="object-cover object-center w-full h-full rounded-lg" src={image.src} />
                        <LabelInput value={label.name} setValue={(label: string) => console.log(label)} />
                      </div>
                    </li>
                  ))
                }
              </ul>
            </div>
          )
        }
      </section>
    </>
  );
}
