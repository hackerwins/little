import React, { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';

import { filterLabels, getMaxLabel, ImagePrediction } from '../../app/database';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { LabelInput } from '../../common/label/LabelInput';
import { selectDataset } from '../dataset/datasetSlice';
import { selectModelInfo, predictAsync } from './modelSlice';

// Camera is a component that allows the user to predict label from webcam.
export function Camera() {
  const dataset = useAppSelector(selectDataset);
  const modelInfo = useAppSelector(selectModelInfo);
  const dispatch = useAppDispatch();

  const webcamRef = useRef<Webcam>(null);
  const [label, setLabel] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    const labels = filterLabels(dataset?.labels || []);
    if (!webcamRef.current || !modelInfo || !labels.length) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const predict = async () => {
      const image = webcamRef.current!.getScreenshot()!;
      if (image) {
        const result = await dispatch(predictAsync(image));
        const scores = result.payload as ImagePrediction;
        const [maxLabel, maxScore] = getMaxLabel(scores, labels);
        setLabel(maxLabel);
        setScore(maxScore);
      }

      timer = setTimeout(predict, 1000);
    };
    predict();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [webcamRef, dispatch, modelInfo, dataset]);

  // TODO(hackerwins): Add a button to clear the label.
  return (
    <>
      <div className="flex w-full h-12">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Use</h1>
        </div>
      </div>
      <div className="relative w-full place-content-center mt-5">
        <Webcam ref={webcamRef} className="w-full h-auto rounded-md" mirrored/>
        <LabelInput value={label} score={score} setValue={setLabel} />
      </div>
    </>
  );
}
