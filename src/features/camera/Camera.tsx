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
    <div className="relative w-full place-content-center mt-5">
      <Webcam className="w-full h-auto rounded-md" mirrored ref={webcamRef} />
      <div className="absolute bottom-3 left-3 flex h-12">
        <button className="rounded-xl px-3 py-1 bg-white backdrop-blur-sm text-sm font-extrabold text-black">Label</button>
      </div>
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex w-12 h-12 bg-gray-300 border-2 border-white rounded-full">
        <button className="m-auto w-10 h-10 rounded-full bg-white hover:bg-red-400" onClick={takePhoto}/>
      </div>
    </div>
  );
}
