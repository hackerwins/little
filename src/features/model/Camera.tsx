import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';

import { filterLabels } from '../../app/database';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { LabelInput } from '../../common/label/LabelInput';
import { selectDataset } from '../dataset/datasetSlice';
import { selectHistory, predictAsync } from './modelSlice';

// Camera is a component that allows the user to predict label from webcam.
export function Camera() {
  const dataset = useAppSelector(selectDataset);
  const history = useAppSelector(selectHistory);
  const dispatch = useAppDispatch();
  const labels = filterLabels(dataset?.labels || []);

  const webcamRef = useRef<Webcam>(null);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!webcamRef.current || !history || !labels.length) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const predict = async () => {
      const image = webcamRef.current!.getScreenshot()!;
      if (image) {
        const result = await dispatch(predictAsync(image));
        const confidenceList = result.payload as Array<number>;

        const prediction = new Map<string, number>();
        let maxKey = '';
        let maxConfidence = 0;
        confidenceList.forEach((confidence: number, idx: number) => {
          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            maxKey = labels[idx].name;
          }
          prediction.set(labels[idx].name, confidence);
        });

        console.log(prediction);
        setLabel(maxKey);
      }
      timer = setTimeout(predict, 1000);
    };
    predict();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [webcamRef, dispatch, history, labels]);

  return (
    <>
      <div className="flex w-full h-12">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Use</h1>
        </div>
      </div>
      <div className="relative w-full place-content-center mt-5">
        <Webcam ref={webcamRef} className="w-full h-auto rounded-md" mirrored/>
        <LabelInput value={label} setValue={setLabel} />
      </div>
    </>
  );
}
