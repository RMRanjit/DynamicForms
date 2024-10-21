import React, { useState, useEffect, ChangeEvent } from "react";
import {
  TextField,
  Select,
  MenuItem,
  Modal,
  Box,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  Typography,
  Container,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  SelectChangeEvent,
  ListItemButton,
  Stepper,
  Step,
  StepLabel,
  StepButton,
} from "@mui/material";
import formConfig from "../config/form-config.json";
import StarRating from "./StarRating";

interface FormElementOption {
  value: string;
  label: string;
}

interface FormElement {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    email?: boolean;
  };
  options?: FormElementOption[];
  showIf?: {
    field: string;
    value: string;
  };
}

interface FormSection {
  id: string;
  title: string;
  elements: FormElement[];
}

interface FormConfig {
  title: string;
  sections: FormSection[];
}

interface CustomElement extends FormElement {
  component: string;
}

const FormRender: React.FC = () => {
  const [config] = useState<FormConfig>(formConfig);
  const [formData, setFormData] = useState<
    Record<string, string | string[] | number>
  >({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionValidity, setSectionValidity] = useState<boolean[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setSectionValidity(new Array(config.sections.length).fill(false));
  }, [config.sections.length]);

  const validateField = (
    element: FormElement,
    value: string | string[] | number
  ): string => {
    if (
      element.validation?.required &&
      (!value || (Array.isArray(value) && value.length === 0))
    ) {
      return "This field is required";
    }
    if (
      element.validation?.min &&
      typeof value === "string" &&
      value.length < element.validation.min
    ) {
      return `Minimum length is ${element.validation.min} characters`;
    }
    if (
      element.validation?.max &&
      typeof value === "string" &&
      value.length > element.validation.max
    ) {
      return `Maximum length is ${element.validation.max} characters`;
    }
    if (element.validation?.email && !/\S+@\S+\.\S+/.test(value as string)) {
      return "Invalid email format";
    }
    return "";
  };

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = event.target;
    let newValue: string | string[];

    if (type === "checkbox") {
      const checkbox = event.target as HTMLInputElement;
      const currentValues = (formData[name] as string[]) || [];
      newValue = checkbox.checked
        ? [...currentValues, value]
        : currentValues.filter((v) => v !== value);
    } else {
      newValue = value;
    }

    setFormData((prevData) => ({ ...prevData, [name]: newValue }));

    const element = config.sections[currentSectionIndex].elements.find(
      (el) => el.id === name
    );
    if (element) {
      const error = validateField(element, newValue);
      setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    }
  };

  const shouldRenderElement = (element: FormElement): boolean => {
    if (!element.showIf) return true;
    return formData[element.showIf.field] === element.showIf.value;
  };

  const renderCustomComponent = (element: CustomElement) => {
    switch (element.component) {
      case "StarRating":
        return (
          <StarRating
            value={(formData[element.id] as number) || 0}
            onChange={(value) => {
              if (value !== null) {
                setFormData((prevData) => ({
                  ...prevData,
                  [element.id]: value,
                }));
                const error = validateField(element, value.toString());
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  [element.id]: error,
                }));
              }
            }}
            max={element.validation?.max || 5}
          />
        );
      default:
        return null;
    }
  };

  const renderElement = (element: FormElement) => {
    const errorMessage = errors[element.id];

    const renderErrorMessage = () =>
      errorMessage ? (
        <Typography color="error" variant="caption">
          {errorMessage}
        </Typography>
      ) : null;

    switch (element.type) {
      case "text":
      case "email":
      case "password":
        return (
          <TextField
            fullWidth
            type={element.type}
            label={element.label}
            value={(formData[element.id] as string) || ""}
            onChange={handleInputChange}
            name={element.id}
            required={element.validation?.required}
            error={!!errorMessage}
            helperText={errorMessage}
            inputProps={{
              minLength: element.validation?.min,
              maxLength: element.validation?.max,
            }}
          />
        );
      case "textarea":
      case "rich-text":
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={element.label}
            value={(formData[element.id] as string) || ""}
            onChange={handleInputChange}
            name={element.id}
            required={element.validation?.required}
            error={!!errorMessage}
            helperText={errorMessage}
            inputProps={{
              maxLength: element.validation?.max,
            }}
          />
        );
      case "select":
        return (
          <FormControl fullWidth error={!!errorMessage}>
            <InputLabel>{element.label}</InputLabel>
            <Select
              value={(formData[element.id] as string) || ""}
              onChange={(event: SelectChangeEvent<string>) => {
                handleInputChange({
                  target: {
                    name: element.id,
                    value: event.target.value,
                    type: "select-one",
                  },
                } as React.ChangeEvent<HTMLSelectElement>);
              }}
              name={element.id}
              required={element.validation?.required}
            >
              <MenuItem value="">Select an option</MenuItem>
              {element.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {renderErrorMessage()}
          </FormControl>
        );
      case "radio":
        return (
          <FormControl component="fieldset" error={!!errorMessage}>
            <Typography>{element.label}</Typography>
            <RadioGroup
              name={element.id}
              value={(formData[element.id] as string) || ""}
              onChange={handleInputChange}
            >
              {element.options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
            {renderErrorMessage()}
          </FormControl>
        );
      case "checkbox":
        return (
          <FormControl component="fieldset" error={!!errorMessage}>
            <Typography>{element.label}</Typography>
            {element.options?.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={(
                      (formData[element.id] as string[]) || []
                    ).includes(option.value)}
                    onChange={handleInputChange}
                    name={element.id}
                    value={option.value}
                  />
                }
                label={option.label}
              />
            ))}
            {renderErrorMessage()}
          </FormControl>
        );
      case "custom":
        return (
          <>
            {renderCustomComponent(element as CustomElement)}
            {renderErrorMessage()}
          </>
        );
      default:
        return null;
    }
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = config.sections[sectionIndex];
    let isValid = true;
    const newErrors: Record<string, string> = {};

    section.elements.forEach((element) => {
      if (shouldRenderElement(element)) {
        const value = formData[element.id];
        const error = validateField(element, value);
        if (error) {
          isValid = false;
          newErrors[element.id] = error;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSectionChange = (index: number) => {
    if (
      index < currentSectionIndex ||
      index === currentSectionIndex + 1 ||
      sectionValidity[index]
    ) {
      if (index > currentSectionIndex) {
        // Validate current section before moving forward
        const isValid = validateSection(currentSectionIndex);
        if (!isValid) return;
      }
      setCurrentSectionIndex(index);
    }
  };

  const handleNextSection = () => {
    const isValid = validateSection(currentSectionIndex);
    if (isValid) {
      const newSectionValidity = [...sectionValidity];
      newSectionValidity[currentSectionIndex] = true;
      setSectionValidity(newSectionValidity);
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateSection(currentSectionIndex);
    const newSectionValidity = [...sectionValidity];
    newSectionValidity[currentSectionIndex] = isValid;
    setSectionValidity(newSectionValidity);

    if (isValid && currentSectionIndex === config.sections.length - 1) {
      // All sections are valid and we're on the last section
      setIsSubmitted(true);
      setIsModalOpen(true);
      // Here you would typically send the form data to a server
      console.log(formData);
    }
  };

  const currentSection = config.sections[currentSectionIndex];

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (isSubmitted) {
      // Reset the form after closing the modal if it was a submission
      setFormData({});
      setCurrentSectionIndex(0);
      setSectionValidity(new Array(config.sections.length).fill(false));
      setIsSubmitted(false);
    }
  };

  const renderResponseModal = () => (
    <Modal
      open={isModalOpen}
      onClose={handleCloseModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          border: "2px solid #000",
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography id="modal-modal-title" variant="h6" component="h2">
          {isSubmitted
            ? "Form Submitted Successfully"
            : "Current Form Responses"}
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </Typography>
        <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
          {isSubmitted ? "Close and Reset Form" : "Close"}
        </Button>
      </Box>
    </Modal>
  );

  const renderStepper = () => (
    <Stepper activeStep={currentSectionIndex} nonLinear>
      {config.sections.map((section, index) => (
        <Step key={section.id} completed={sectionValidity[index]}>
          <StepButton onClick={() => handleSectionChange(index)}>
            {section.title}
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );

  return (
    <Container maxWidth="lg">
      <Paper
        elevation={3}
        style={{ padding: "20px", marginTop: "20px", position: "relative" }}
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={handleOpenModal}
          style={{ position: "absolute", top: "20px", right: "20px" }}
        >
          Show Current Responses
        </Button>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {config.title}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Typography variant="h5" gutterBottom>
                {config.sections[currentSectionIndex].title}
              </Typography>
              <Grid container spacing={2}>
                {config.sections[currentSectionIndex].elements.map(
                  (element) =>
                    shouldRenderElement(element) && (
                      <Grid item xs={12} key={element.id}>
                        {renderElement(element)}
                      </Grid>
                    )
                )}
              </Grid>
              <Grid container spacing={2} style={{ marginTop: "20px" }}>
                <Grid item>
                  {currentSectionIndex > 0 && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handlePreviousSection}
                    >
                      Previous
                    </Button>
                  )}
                </Grid>
                <Grid item>
                  {currentSectionIndex < config.sections.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNextSection}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button variant="contained" color="primary" type="submit">
                      Submit
                    </Button>
                  )}
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper elevation={2} style={{ padding: "10px" }}>
              <Typography variant="h6" gutterBottom>
                Sections
              </Typography>
              <List>
                {config.sections.map((section, index) => (
                  <ListItemButton
                    key={section.id}
                    onClick={() => handleSectionChange(index)}
                    selected={index === currentSectionIndex}
                  >
                    <ListItemText
                      primary={section.title}
                      style={{
                        color: sectionValidity[index] ? "green" : "inherit",
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4 }}>{renderStepper()}</Box>
      </Paper>
      {renderResponseModal()}
    </Container>
  );
};

export default FormRender;
