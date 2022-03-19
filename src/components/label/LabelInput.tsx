import React, { useCallback, useState } from 'react';

const DefaultValue = 'Label';

// LabelInput component displays a label and an input field to set the value of a label.
export function LabelInput(props: {
  value: string;
  setValue: (value: string) => void;
}) {
  const {value, setValue} = props;
  const [showInput, setShowInput] = useState(false);

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

  return (
    <div className="absolute bottom-3 left-3 h-10 rounded p-2 text-md text-white backdrop-blur-sm bg-white/30">
      <span className="text-md" onClick={handleClick}>{value || DefaultValue}</span>
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
