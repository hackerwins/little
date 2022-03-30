import React, { useCallback, useState } from 'react';

import { CorrectIcon } from './CorrectIcon';
import { IncorrectIcon } from './IncorrectIcon';

const DefaultValue = 'Label';

// LabelInput component displays a label and an input field to set the value of a label.
export function LabelInput(props: {
  value: string;
  prediction?: string;
  setValue: (value: string) => void;
}) {
  const {prediction, value, setValue} = props;
  const [showInput, setShowInput] = useState(false);
  const correct = prediction === value;

  // previous value is used to restore the previous value when cancelling.
  const [previous, setPrevious] = useState(value);

  const handleClick = useCallback(() => {
    setShowInput(true);
    setPrevious(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    setShowInput(false);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setShowInput(false);
    } else if (event.key === 'Escape') {
      setShowInput(false);
      setValue(previous);
    }
  }, [previous, setValue]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }, [setValue]);

  const bgColor = prediction ? (showInput || correct) ? 'backdrop-blur-sm bg-green-500/30' : 'bg-red-500' : 'backdrop-blur-sm bg-white/30';

  return (
    <div className={`absolute bottom-3 left-3 h-10 rounded p-2 text-md text-white ${bgColor}`}>
      {
        prediction && !showInput && (
          <span className="text-md" onClick={handleClick}>
            {prediction} &nbsp; {correct ? <CorrectIcon /> : <IncorrectIcon />}
          </span>
        )
      }
      {
        (!prediction || showInput) && <span className="text-md" onClick={handleClick}>{value || DefaultValue}</span>
      }
      {
        showInput && (
          <input
            type="text"
            className="absolute left-2 w-full outline-none bg-transparent"
            placeholder={DefaultValue}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        )
      }
    </div>
  );
}
