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

    let requestID: ReturnType<typeof requestAnimationFrame>;
    const predict = async () => {
      const image = webcamRef.current?.getScreenshot()!;
      if (image) {
        const result = await dispatch(predictAsync(image));
        const scores = result.payload as ImagePrediction;
        const [maxLabel, maxScore] = getMaxLabel(scores, labels);
        setLabel(maxLabel);
        setScore(maxScore);
      }

      requestID = window.requestAnimationFrame(predict);
    };
    predict();

    return () => {
      if (requestID) {
        cancelAnimationFrame(requestID);
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
      <section>
        {
          !modelInfo && (
            <span className="text-xl text-center aline-middle">After your model has trained,<br />play with it using new images.</span>
          )
        }
        {
          modelInfo && (
            <div className="relative w-full max-h-[calc(100vh-8rem)] mt-5 flex items-center justify-center overflow-hidden">
              <Webcam ref={webcamRef} className="w-full rounded-md" mirrored/>
              <LabelInput value={label} score={score} setValue={setLabel} />
            </div>
          )
        }
      </section>
    </>
  );
}
