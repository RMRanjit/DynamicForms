import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dayjs from "dayjs";

interface Column {
  id: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    compare?: {
      field: string;
      operator: "lt" | "lte" | "gt" | "gte" | "eq" | "neq";
    };
    errorMessages?: {
      required?: string;
      min?: string;
      max?: string;
      compare?: string;
    };
  };
}

interface TableComponentProps {
  columns: Column[];
  value: any[];
  onChange: (newValue: any[]) => void;
}

const TableComponent: React.FC<TableComponentProps> = ({
  columns,
  value,
  onChange,
}) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<any>({});
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleEdit = (index: number) => {
    setEditingRow(index);
    setEditedValues(value[index]);
    setErrors({});
  };

  const handleDelete = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const validateRow = (row: any): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    columns.forEach((column) => {
      if (column.validation) {
        const { errorMessages } = column.validation;

        if (column.validation.required && !row[column.id]) {
          newErrors[column.id] =
            errorMessages?.required || `${column.label} is required`;
          isValid = false;
        }
        if (column.validation.min && row[column.id] < column.validation.min) {
          newErrors[column.id] =
            errorMessages?.min ||
            `${column.label} minimum value is ${column.validation.min}`;
          isValid = false;
        }
        if (column.validation.max && row[column.id] > column.validation.max) {
          newErrors[column.id] =
            errorMessages?.max ||
            `${column.label} maximum value is ${column.validation.max}`;
          isValid = false;
        }
        if (column.validation.compare) {
          const { field, operator } = column.validation.compare;
          const compareColumn = columns.find((col) => col.id === field);
          const compareLabel = compareColumn ? compareColumn.label : field;
          const compareValue = row[field];
          const currentValue = row[column.id];

          let comparisonFailed = false;
          switch (operator) {
            case "lt":
              comparisonFailed = !(currentValue < compareValue);
              break;
            case "lte":
              comparisonFailed = !(currentValue <= compareValue);
              break;
            case "gt":
              comparisonFailed = !(currentValue > compareValue);
              break;
            case "gte":
              comparisonFailed = !(currentValue >= compareValue);
              break;
            case "eq":
              comparisonFailed = currentValue !== compareValue;
              break;
            case "neq":
              comparisonFailed = currentValue === compareValue;
              break;
          }

          if (comparisonFailed) {
            newErrors[column.id] =
              errorMessages?.compare ||
              `${column.label} must be ${getOperatorText(
                operator
              )} ${compareLabel}`;
            isValid = false;
          }
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const getOperatorText = (operator: string): string => {
    switch (operator) {
      case "lt":
        return "less than";
      case "lte":
        return "less than or equal to";
      case "gt":
        return "greater than";
      case "gte":
        return "greater than or equal to";
      case "eq":
        return "equal to";
      case "neq":
        return "not equal to";
      default:
        return "";
    }
  };

  const handleSave = () => {
    if (validateRow(editedValues)) {
      if (editingRow !== null) {
        const newValue = [...value];
        newValue[editingRow] = editedValues;
        onChange(newValue);
      } else {
        onChange([...value, editedValues]);
      }
      handleCloseDialog();
    }
  };

  const handleCloseDialog = () => {
    setEditingRow(null);
    setIsAddingRow(false);
    setEditedValues({});
    setErrors({});
  };

  const handleInputChange = (columnId: string, newValue: string | boolean) => {
    setEditedValues({ ...editedValues, [columnId]: newValue });
  };

  const handleAdd = () => {
    setIsAddingRow(true);
    setEditedValues({});
    setErrors({});
  };

  const renderInputField = (column: Column) => {
    const errorMessage = errors[column.id];

    switch (column.type) {
      case "text":
      case "email":
      case "password":
        return (
          <TextField
            key={column.id}
            label={column.label}
            type={column.type}
            value={editedValues[column.id] || ""}
            onChange={(e) => handleInputChange(column.id, e.target.value)}
            fullWidth
            margin="normal"
            error={!!errorMessage}
            helperText={errorMessage}
          />
        );
      case "number":
        return (
          <TextField
            key={column.id}
            label={column.label}
            type="number"
            value={editedValues[column.id] || ""}
            onChange={(e) => handleInputChange(column.id, e.target.value)}
            fullWidth
            margin="normal"
            error={!!errorMessage}
            helperText={errorMessage}
          />
        );
      case "date":
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={column.label}
              value={
                editedValues[column.id] ? dayjs(editedValues[column.id]) : null
              }
              onChange={(newValue) =>
                handleInputChange(column.id, newValue?.toISOString() || "")
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: "normal",
                  error: !!errorMessage,
                  helperText: errorMessage,
                },
              }}
            />
          </LocalizationProvider>
        );
      case "select":
        return (
          <FormControl fullWidth margin="normal" error={!!errorMessage}>
            <InputLabel>{column.label}</InputLabel>
            <Select
              value={editedValues[column.id] || ""}
              onChange={(e) =>
                handleInputChange(column.id, e.target.value as string)
              }
              label={column.label}
            >
              {column.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
          </FormControl>
        );
      case "checkbox":
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!editedValues[column.id]}
                onChange={(e) => handleInputChange(column.id, e.target.checked)}
              />
            }
            label={column.label}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id}>{column.label}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{row[column.id]}</TableCell>
                ))}
                <TableCell>
                  <IconButton onClick={() => handleEdit(index)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(index)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Item
        </Button>
      </Box>

      <Dialog
        open={editingRow !== null || isAddingRow}
        onClose={handleCloseDialog}
      >
        <DialogTitle>
          {editingRow !== null ? "Edit Row" : "Add Row"}
        </DialogTitle>
        <DialogContent>
          {columns.map((column) => renderInputField(column))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TableComponent;
