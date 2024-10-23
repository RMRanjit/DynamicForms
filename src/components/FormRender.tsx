import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ListItemText,
  SelectChangeEvent,
  Stepper,
  Step,
  StepButton,
  useMediaQuery,
  useTheme,
  FormHelperText,
  FormLabel,
  FormGroup,
  IconButton,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemButton,
  Divider,
} from "@mui/material";
import { visuallyHidden } from "@mui/utils";
import formConfig from "../config/form-config.json";
import StarRating from "./StarRating";
import DOMPurify from "dompurify";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import TableComponent from "./TableComponent";
import { FormElementType, Column, ShowIfCondition } from "../types/formTypes";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import FormattedInput from "./FormattedInput";
import axios from "axios";

// First, let's define more precise types for our form structure
type FormElement = {
  id: string;
  type: string;
  label: string;
  options?:
    | Array<{ value: string; label: string }>
    | { api: string }
    | { type: string; endpoint: string; params?: Record<string, string> };
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    InputPattern?: string;
    email?: boolean;
    date?: {
      maxDate?: string | number;
      minDate?: string | number;
    };
    compare?: {
      field: string;
      operator: "lt" | "lte" | "gt" | "gte" | "eq" | "neq";
    };
    errorMessages?: {
      required?: string;
      min?: string;
      max?: string;
      pattern?: string;
      date?: string;
      compare?: string;
    };
  };
  placeholder?: string;
  showIf?: ShowIfCondition | ShowIfCondition[];
  columns?: Column[];
};

// type FormElementType = FormElement;

interface Subsection {
  id: string;
  title: string;
  elements: FormElement[];
  showIf?: ShowIfCondition;
}

type FormSection = {
  id: string;
  title: string;
  description?: string;
  prefetch?: string[];
  elements: FormElement[];
  subsections?: Subsection[];
};

type ApiConfig = {
  endpoint: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  method?: string;
  url?: string;
  transform?: string;
  cache?: boolean;
};

type FormConfig = {
  title?: string;
  sections: FormSection[];
  apis?: Record<string, ApiConfig>;
};

type ApiCacheType = Record<
  string,
  Array<{ value: string; label: string }> | undefined
>;

interface CustomElement extends FormElement {
  component: string;
}

interface DateValidation {
  minDate?: string | number;
  maxDate?: string;
}

interface Validation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  date?: DateValidation;
  compare?: {
    field: string;
    operator: "lt" | "lte" | "gt" | "gte" | "eq" | "neq";
  };
  errorMessages?: {
    required?: string;
    min?: string;
    max?: string;
    pattern?: string;
    date?: string;
    compare?: string;
  };
  InputPattern?: string;
}

// Add this type guard function
function isNumber(value: string | number): value is number {
  return typeof value === "number";
}

const FormRender: React.FC = () => {
  const [config, setConfig] = useState<FormConfig>(() => {
    // Perform any necessary transformations on formConfig here
    return formConfig as FormConfig;
  });

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [sectionValidity, setSectionValidity] = useState<boolean[]>([]);
  const [isCurrentResponsesModalOpen, setIsCurrentResponsesModalOpen] =
    useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [apiCache, setApiCache] = useState<Record<string, any>>({});

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config && config.sections) {
      setSectionValidity(new Array(config.sections.length).fill(false));
    }
  }, [config]);

  const validateField = (element: FormElement, value: any): string | null => {
    // Implement your field validation logic here
    // Return null if valid, or an error message string if invalid
    return null;
  };

  const validateSection = (sectionIndex: number): boolean => {
    const section = config.sections[sectionIndex];
    const sectionElements = section.subsections
      ? section.subsections.flatMap((subsection) => subsection.elements)
      : [];

    return sectionElements.every((element) => {
      const value = formData[element.id];
      return !validateField(element, value);
    });
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string | string[] | number | boolean
  ) => {
    const name = event.target.name;
    const newValue = value !== undefined ? value : event.target.value;

    setFormData((prevData) => ({ ...prevData, [name]: newValue }));
    updateValidation(name, newValue);

    // Announce validation errors to screen readers
    if (errors[name]) {
      const errorMessage = errors[name];
      if (errorMessage) {
        announceError(errorMessage);
      }
    }
  };

  const announceError = (error: string) => {
    const announcer = document.getElementById("error-announcer");
    if (announcer) {
      announcer.textContent = error;
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const name = event.target.name;
    const value = event.target.value;

    setFormData((prevData) => ({ ...prevData, [name]: value }));
    updateValidation(name, value);
  };

  const updateValidation = (name: string, value: any) => {
    const element = config.sections
      .flatMap((section) => section.subsections || [])
      .flatMap((subsection) => subsection.elements || [])
      .find((el) => el?.id === name);

    if (element && element.validation) {
      let errorMessage = "";

      if (
        element.validation.required &&
        (value === "" ||
          value === null ||
          value === undefined ||
          (Array.isArray(value) && value.length === 0))
      ) {
        errorMessage = "This field is required";
      } else if (
        element.validation.min &&
        typeof value === "string" &&
        value.length < element.validation.min
      ) {
        errorMessage = `Minimum length is ${element.validation.min}`;
      } else if (
        element.validation.max &&
        typeof value === "string" &&
        value.length > element.validation.max
      ) {
        errorMessage = `Maximum length is ${element.validation.max}`;
      } else if (
        element.validation.pattern &&
        typeof value === "string" &&
        !new RegExp(element.validation.pattern).test(value)
      ) {
        errorMessage =
          element.validation.errorMessages?.pattern || "Invalid format";
      }

      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: errorMessage,
      }));
    }
  };

  const handleDateChange = (name: string, value: dayjs.Dayjs | null) => {
    updateFormData(name, value ? value.format("YYYY-MM-DD") : "");
  };

  const updateFormData = (
    name: string,
    value: string | string[] | number | boolean
  ) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    const element = config.sections
      .flatMap((section) => section.subsections || [])
      .flatMap((subsection) => subsection.elements || [])
      .find((el) => el.id === name);

    if (element) {
      const error = validateField(element, value);
      // Only set the error if it's a string
      if (error !== null) {
        setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
      } else {
        // If there's no error, you can remove the entry from errors
        setErrors((prevErrors) => {
          const { [name]: _, ...rest } = prevErrors; // Destructure to remove the error
          return rest;
        });
      }
    }
  };

  const evaluateCondition = (condition: ShowIfCondition): boolean => {
    const { field, value } = condition;
    return formData[field] === value;
  };

  const isElementShown = (element: FormElement): boolean => {
    if (!element.showIf) return true;

    const conditions = Array.isArray(element.showIf)
      ? element.showIf
      : [element.showIf];

    return conditions.every(evaluateCondition);
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

  const callApi = useCallback(
    async (apiName: string) => {
      if (!config.apis || !config.apis[apiName]) {
        throw new Error(`API configuration for ${apiName} not found`);
      }

      const apiConfig = config.apis[apiName];
      const headers = { ...apiConfig.headers };
      const params = { ...apiConfig.params };

      // Replace placeholders in params with form data
      Object.entries(params).forEach(([key, value]) => {
        if (
          typeof value === "string" &&
          value.startsWith("{") &&
          value.endsWith("}")
        ) {
          const formField = value.slice(1, -1);
          params[key] = String(formData[formField] || "");
        }
      });

      try {
        const response = await axios({
          method: apiConfig.method || "GET",
          url: apiConfig.endpoint,
          headers,
          params,
        });

        let data = response.data;

        if (apiConfig.transform) {
          // Implement your transform logic here
          // For example:
          // data = transformData(data, apiConfig.transform);
        }

        if (apiConfig.cache !== false) {
          setApiCache((prev) => ({ ...prev, [apiName]: data }));
        }

        return data;
      } catch (error) {
        console.error(`Error calling API ${apiName}:`, error);
        throw error;
      }
    },
    [config.apis, formData]
  );

  useEffect(() => {
    const currentSection = config.sections[currentSectionIndex];
    if (currentSection.prefetch) {
      currentSection.prefetch.forEach((apiName: string) => {
        callApi(apiName).catch((error) => {
          console.error(`Error prefetching API ${apiName}:`, error);
        });
      });
    }
  }, [currentSectionIndex, callApi, config.sections]);

  const handleMultiSelectChange = (event: SelectChangeEvent<string[]>) => {
    const { name, value } = event.target;
    updateFormData(name, typeof value === "string" ? value.split(",") : value);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    updateValidation(name, value);
  };

  const renderElement = (element: FormElement) => {
    const errorMessage = errors[element.id];

    switch (element.type) {
      case "text":
      case "email":
      case "password":
      case "textarea":
      case "rich-text":
        if (element.validation?.InputPattern) {
          return (
            <FormattedInput
              fullWidth
              label={element.label}
              value={String(formData[element.id] || "")}
              onChange={(value) => updateFormData(element.id, value)}
              onBlur={handleBlur}
              name={element.id}
              required={element.validation?.required}
              error={!!errorMessage}
              helperText={errorMessage}
              InputPattern={element.validation.InputPattern}
              inputProps={{
                "aria-describedby": `${element.id}-error`,
                "aria-invalid": !!errorMessage,
              }}
            />
          );
        }
        return (
          <TextField
            fullWidth
            type={element.type}
            label={element.label}
            value={String(formData[element.id] || "")}
            onChange={handleInputChange}
            onBlur={handleBlur}
            name={element.id}
            required={element.validation?.required}
            error={!!errorMessage}
            helperText={errorMessage}
            inputProps={{
              "aria-describedby": `${element.id}-error`,
              "aria-invalid": !!errorMessage,
            }}
          />
        );
      case "select":
      case "multiselect":
        const getApiName = (options: FormElement["options"]): string => {
          if (
            options &&
            typeof options === "object" &&
            !Array.isArray(options) &&
            "api" in options
          ) {
            return options.api;
          }
          return "";
        };

        const apiName = getApiName(element.options);

        return (
          <FormControl fullWidth error={!!errors[element.id]}>
            <InputLabel id={`${element.id}-label`}>{element.label}</InputLabel>
            <Select
              labelId={`${element.id}-label`}
              id={element.id}
              name={element.id}
              multiple={element.type === "multiselect"}
              value={
                (formData[element.id] as string | string[]) ||
                (element.type === "multiselect" ? [] : "")
              }
              onChange={
                element.type === "multiselect"
                  ? handleMultiSelectChange
                  : (handleSelectChange as any)
              }
            >
              {apiName ? (
                apiCache[apiName] ? (
                  apiCache[apiName]!.map(
                    (option: { value: string; label: string }) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    )
                  )
                ) : (
                  <MenuItem value="">Loading...</MenuItem>
                )
              ) : Array.isArray(element.options) ? (
                element.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="">No options available</MenuItem>
              )}
            </Select>
            {errors[element.id] && (
              <FormHelperText>{errors[element.id]}</FormHelperText>
            )}
          </FormControl>
        );
      case "radio":
        return (
          <FormControl component="fieldset" error={!!errorMessage}>
            <FormLabel component="legend" id={`${element.id}-label`}>
              {element.label}
            </FormLabel>
            <RadioGroup
              aria-labelledby={`${element.id}-label`}
              name={element.id}
              value={(formData[element.id] as string) || ""}
              onChange={handleInputChange}
            >
              {Array.isArray(element.options) &&
                element.options.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
            </RadioGroup>
            {errorMessage && (
              <FormHelperText id={`${element.id}-error`}>
                {errorMessage}
              </FormHelperText>
            )}
          </FormControl>
        );
      case "checkbox":
        return (
          <FormControl component="fieldset" error={!!errorMessage}>
            <FormLabel component="legend">{element.label}</FormLabel>
            <FormGroup>
              {Array.isArray(element.options) &&
                element.options.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={(
                          (formData[element.id] as string[]) || []
                        ).includes(option.value)}
                        onChange={(e) => {
                          const currentValues =
                            (formData[element.id] as string[]) || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v) => v !== option.value);
                          handleInputChange(
                            {
                              target: { name: element.id, value: newValues },
                            } as any,
                            newValues
                          );
                        }}
                        name={element.id}
                        value={option.value}
                      />
                    }
                    label={option.label}
                  />
                ))}
            </FormGroup>
            {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
          </FormControl>
        );
      case "custom":
        return (
          <>
            {renderCustomComponent(element as CustomElement)}
            {errorMessage && (
              <FormHelperText error>{errorMessage}</FormHelperText>
            )}
          </>
        );
      case "date":
        return (
          <DatePicker
            label={element.label}
            value={
              formData[element.id]
                ? dayjs(formData[element.id] as string)
                : null
            }
            onChange={(newValue) => handleDateChange(element.id, newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: element.validation?.required,
                error: !!errorMessage,
                helperText: errorMessage,
                name: element.id,
              },
            }}
            maxDate={
              element.validation?.date?.maxDate === "today"
                ? dayjs()
                : dayjs(element.validation?.date?.maxDate)
            }
            minDate={
              element.validation?.date?.minDate
                ? isNumber(element.validation.date.minDate)
                  ? dayjs().subtract(element.validation.date.minDate, "day")
                  : dayjs(element.validation.date.minDate)
                : undefined
            }
          />
        );
      case "table":
        return (
          <>
            <TableComponent
              columns={element.columns || []}
              value={(formData[element.id] as any[]) || []}
              onChange={(value) => {
                setFormData((prevData) => ({
                  ...prevData,
                  [element.id]: value,
                }));
                updateValidation(element.id, value);
              }}
            />
            {errorMessage && (
              <FormHelperText error>{errorMessage}</FormHelperText>
            )}
          </>
        );
      default:
        return null;
    }
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
    console.log("handleNextSection called");
    console.log("Current section index:", currentSectionIndex);
    if (validateSection(currentSectionIndex)) {
      console.log("Section validated successfully");
      if (currentSectionIndex < config.sections.length - 1) {
        console.log("Moving to next section");
        setCurrentSectionIndex((prevIndex) => {
          console.log("New section index:", prevIndex + 1);
          return prevIndex + 1;
        });
      } else {
        console.log("On last section, handling submit");
        handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent<HTMLFormElement>);
      }
    } else {
      console.log("Section validation failed");
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
      setIsSubmissionModalOpen(true);
      // Here you would typically send the form data to a server
      console.log(formData);
    }
  };

  const handleOpenCurrentResponsesModal = () => {
    setIsCurrentResponsesModalOpen(true);
  };

  const handleCloseCurrentResponsesModal = () => {
    setIsCurrentResponsesModalOpen(false);
  };

  const handleCloseSubmissionModal = () => {
    setIsSubmissionModalOpen(false);
    // Reset the form after closing the submission modal
    setFormData({});
    setCurrentSectionIndex(0);
    setSectionValidity(new Array(config.sections.length).fill(false));
    setIsSubmitted(false);
  };

  const handleSaveResponses = () => {
    const dataStr = JSON.stringify(formData);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "form_responses.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleLoadResponses = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedData = JSON.parse(e.target?.result as string);
          setFormData(loadedData);
        } catch (error) {
          console.error("Error parsing JSON:", error);
          // You might want to show an error message to the user here
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const renderCurrentResponsesModal = () => (
    <Modal
      open={isCurrentResponsesModalOpen}
      onClose={handleCloseCurrentResponsesModal}
      aria-labelledby="current-responses-modal-title"
      aria-describedby="current-responses-modal-description"
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
        <Typography
          id="current-responses-modal-title"
          variant="h6"
          component="h2"
        >
          Current Form Responses
        </Typography>
        <Typography id="current-responses-modal-description" sx={{ mt: 2 }}>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </Typography>
        <Button onClick={handleCloseCurrentResponsesModal} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>
  );

  const renderSubmissionModal = () => (
    <Modal
      open={isSubmissionModalOpen}
      onClose={handleCloseSubmissionModal}
      aria-labelledby="submission-modal-title"
      aria-describedby="submission-modal-description"
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
        <Typography id="submission-modal-title" variant="h6" component="h2">
          Form Submitted Successfully
        </Typography>
        <Typography id="submission-modal-description" sx={{ mt: 2 }}>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </Typography>
        <Button onClick={handleCloseSubmissionModal} sx={{ mt: 2 }}>
          Close and Reset Form
        </Button>
      </Box>
    </Modal>
  );

  const calculateProgress = () => {
    // Progress is based on the current section index (0-based)
    return ((currentSectionIndex + 1) / config.sections.length) * 100;
  };

  const renderSectionList = () => (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Sections
      </Typography>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" component="span">
          Form Progress
        </Typography>
        <Typography variant="body2" component="span" sx={{ float: "right" }}>
          {`${Math.round(calculateProgress())}%`}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={calculateProgress()} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <IconButton
          color="primary"
          onClick={handleSaveResponses}
          title="Save Responses"
        >
          <SaveIcon />
        </IconButton>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleLoadResponses}
          accept=".json"
        />
        <IconButton
          color="secondary"
          onClick={() => fileInputRef.current?.click()}
          title="Load Responses"
        >
          <UploadIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />
      <List>
        {config.sections.map((section, index) => (
          <ListItem key={section.id} disablePadding>
            <ListItemButton
              selected={currentSectionIndex === index}
              onClick={() => handleSectionChange(index)}
            >
              <ListItemText primary={section.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderStepper = () => (
    <Stepper
      activeStep={currentSectionIndex}
      nonLinear
      orientation={isSmallScreen ? "vertical" : "horizontal"}
    >
      {config.sections.map((section, index) => (
        <Step key={section.id} completed={sectionValidity[index]}>
          <StepButton onClick={() => handleSectionChange(index)}>
            {isSmallScreen ? section.title.slice(0, 10) + "..." : section.title}
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );

  const renderSectionDescription = (description?: string) => {
    if (!description) return null;

    return (
      <Typography
        variant="body1"
        component="div"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
        sx={{ mb: 2 }}
      />
    );
  };

  const shouldShowSubsection = (subsection: Subsection): boolean => {
    if (!subsection.showIf) return true;

    const conditions = Array.isArray(subsection.showIf)
      ? subsection.showIf
      : [subsection.showIf];

    return conditions.every(evaluateCondition);
  };

  const renderSubsections = () => {
    const currentSection = config.sections[currentSectionIndex];
    return (
      currentSection.subsections?.map((subsection) => {
        if (shouldShowSubsection(subsection)) {
          return (
            <Box key={subsection.id} sx={{ mb: 4 }}>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                {subsection.title}
              </Typography>
              {subsection.elements.map((element) => (
                <Box key={element.id} sx={{ mb: 2 }}>
                  {renderElement(element)}
                </Box>
              ))}
            </Box>
          );
        }
        return null;
      }) ?? null
    );
  };

  const renderNavigationButtons = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "20px",
      }}
    >
      <Button
        variant="outlined"
        color="primary"
        onClick={handlePreviousSection}
        disabled={currentSectionIndex === 0}
      >
        Previous
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleNextSection}
        disabled={currentSectionIndex === config.sections.length - 1}
      >
        Next
      </Button>
    </div>
  );

  if (!config || !config.sections) {
    return <div>Loading...</div>; // or some other loading indicator
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
          {config.title}
        </Typography>

        {renderStepper()}

        <Grid container spacing={3}>
          {!isSmallScreen && (
            <Grid item xs={3}>
              {renderSectionList()}
            </Grid>
          )}

          <Grid item xs={isSmallScreen ? 12 : 9}>
            <form onSubmit={handleSubmit}>
              {renderSectionDescription(
                config.sections[currentSectionIndex].description
              )}
              {renderSubsections()}
              {renderNavigationButtons()}
            </form>

            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenCurrentResponsesModal}
              sx={{ mt: 2 }}
            >
              Show Current Responses
            </Button>
          </Grid>
        </Grid>

        {renderCurrentResponsesModal()}
        {renderSubmissionModal()}
      </Container>
    </LocalizationProvider>
  );
};

export default FormRender;
