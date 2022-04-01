import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import debounce from 'lodash/debounce';

import { useAppDispatch } from '../../app/hooks';
import { trainModelAsync } from '../model/modelSlice';
import { addImageToDatasetAsync } from './datasetSlice';
import { LabelInput } from '../../common/label/LabelInput';

// Camera component for taking pictures and adding them to the dataset.
export function Camera() {
  const dispatch = useAppDispatch();
  const { search } = useLocation();
  const query = useMemo(() => new URLSearchParams(search), [search]);

  const webcamRef = useRef<Webcam>(null);
  const [label, setLabel] = useState(query.get('label') || '');

  useEffect(() => {
    setLabel(query.get('label') || '');
  }, [query]);

  const debounceTrain = useCallback(debounce(async () => {
    await dispatch(trainModelAsync(1));
  }, 3000), [dispatch]);

  // TODO(hackerwins): Add sound effects for when taking a photo.
  const takePhoto = useCallback(async () => {
    const photo = webcamRef.current?.getScreenshot();
    if (photo) {
      await dispatch(addImageToDatasetAsync({
        datasetID: 1,
        label: label || 'Unlabeled',
        image: photo,
      }))

      debounceTrain();
    }
  }, [label, dispatch, webcamRef, debounceTrain]);

  return (
    <>
      <div className="flex w-full h-12">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Camera</h1>
        </div>
        <Link to="/labels" type="button" className="text-white bg-gray-700 hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center mr-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
          Done
        </Link>
      </div>

      <div className="relative w-full place-content-center mt-5">
        <Webcam className="w-full h-auto rounded-md" mirrored ref={webcamRef} />
        <LabelInput value={label} setValue={setLabel} />
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-12 flex backdrop-blur-sm bg-gray/30 border-2 border-white rounded-full">
          <button className="m-auto w-10 h-10 rounded-full backdrop-blur-sm bg-white/30 hover:bg-red-400" onClick={takePhoto}/>
        </div>
      </div>
    </>
  );
}
