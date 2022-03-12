import React, { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

export function Camera() {
  const webcamRef = useRef<Webcam>(null);

  // TODO(hackerwins): Add sound effects for when taking a photo.
  const takePhoto = useCallback(() => {
    const photo = webcamRef.current?.getScreenshot();
    console.log(photo);
  }, [webcamRef]);

  return (
    <div className="relative flex h-auto w-auto place-content-center">
      <Webcam className="rounded-md" mirrored ref={webcamRef} />
      <div className="absolute h-auto w-auto self-end mb-4">
        <div className="flex w-12 h-12 bg-gray-300 border-2 border-white rounded-full self-end ml-4">
          <button className="m-auto w-10 h-10 rounded-full bg-white hover:bg-red-400" onClick={takePhoto}/>
        </div>
      </div>
    </div>
  );
}
