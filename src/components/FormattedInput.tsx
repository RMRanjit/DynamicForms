import React, { useState } from "react";
import { TextField, TextFieldProps } from "@mui/material";

interface FormattedInputProps extends Omit<TextFieldProps, "onChange"> {
  InputPattern: string;
  onChange: (value: string) => void;
  label: string;
}

const FormattedInput: React.FC<FormattedInputProps> = ({
  InputPattern,
  onChange,
  label,
  ...props
}) => {
  const [value, setValue] = useState("");

  const formatValue = (input: string) => {
    let formatted = InputPattern;
    let i = 0;
    return formatted.replace(/#/g, () => input[i++] || "");
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value.replace(/\D/g, "");
    const formatted = formatValue(input);
    setValue(formatted);
    onChange(formatted); // Make sure this is calling the parent's onChange function
  };

  return (
    <TextField
      {...props}
      label={label}
      value={value}
      onChange={handleChange}
      inputProps={{
        ...props.inputProps,
        "aria-label": label,
        "aria-describedby": `${props.id}-helper-text`,
      }}
      FormHelperTextProps={{
        ...props.FormHelperTextProps,
        id: `${props.id}-helper-text`,
      }}
    />
  );
};

export default FormattedInput;
