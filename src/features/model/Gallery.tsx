import React from 'react';

import { LabelPrediction, getMaxLabel } from '../../app/database';
import { useAppSelector } from '../../app/hooks';
import { selectDataset } from '../dataset/datasetSlice';
import { selectModelInfo } from '../model/modelSlice';
import { LabelInput } from '../../common/label/LabelInput';

// Gallery component displays a list of images of a dataset.
export function Gallery({label}: {label?: string}) {
  const dataset = useAppSelector(selectDataset);
  const modelInfo = useAppSelector(selectModelInfo);

  const labels = dataset?.labels || [];
  const title = label ? `${label}` : 'All Images';
  const selectedLabels = label ? labels.filter(l => l.name === label) : labels;
  const filteredLabels = selectedLabels.filter(l => l.images.length);
  const labelPredictions = modelInfo?.prediction.labels || [];

  const labelPredictionMap = new Map<string, LabelPrediction>();
  for (const labelPrediction of labelPredictions) {
    labelPredictionMap.set(labelPrediction.label, labelPrediction);
  }

  return (
    <>
      <div className="flex w-full h-12">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      </div>
      <section>
        {
          (!filteredLabels.length || !modelInfo) && (
            <span className="text-xl text-center aline-middle">After labeling your images,<br />your model will start training.</span>
          )
        }
        {
          modelInfo && (
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
                          <LabelInput
                            prediction={getMaxLabel(labelPredictionMap.get(label.name)!.images[index], labels)}
                            value={label.name}
                            setValue={(label: string) => console.log(label)}
                          />
                        </div>
                      </li>
                    ))
                  }
                </ul>
              </div>
            )
          )
        }
      </section>
    </>
  );
}
