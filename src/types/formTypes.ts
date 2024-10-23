export interface FormElementType {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    email?: boolean;
    date?: {
      maxDate?: "today" | string;
      minDate?: number;
    };
    pattern?: string;
    message?: string;
  };
  options?: { value: string; label: string }[];
  showIf?: ShowIfCondition | ShowIfCondition[];
  columns?: Column[];
}

export interface Column {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "multiselect";
  options?: { value: string; label: string }[];
  validation: {
    required?: boolean;
    minLength?: number;
    min?: number;
    max?: number;
    minSelect?: number;
    maxSelect?: number;
  };
}

export interface FormElement {
  id: string;
  type: string;
  label: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    min?: number;
    max?: number;
  };
  options?: { value: string; label: string }[];
  columns?: Column[];
  // Add other properties as needed
}

export interface ShowIfCondition {
  field: string;
  value?: string | number | boolean;
  compareField?: string;
  operator?: "eq" | "neq" | "gt" | "lt" | "gte" | "lte";
}
