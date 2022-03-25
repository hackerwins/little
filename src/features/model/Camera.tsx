import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';

import { useAppDispatch } from '../../app/hooks';
import { LabelInput } from '../../common/label/LabelInput';
import { predictAsync } from './modelSlice';

export function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const dispatch = useAppDispatch();
  const [label, setLabel] = useState('');

  // TODO(hackerwins): Use video stream instead of image.
  const takePhoto = useCallback(async () => {
    const photo = webcamRef.current?.getScreenshot();
    if (photo) {
      await dispatch(predictAsync(photo))
    }
  }, [dispatch, webcamRef]);


  return (
    <>
      <div className="flex w-full h-12">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Camera</h1>
        </div>
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
