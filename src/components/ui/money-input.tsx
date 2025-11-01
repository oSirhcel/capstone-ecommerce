import { cn } from "@/lib/utils";
import * as React from "react";
import {
  InputGroup,
  InputGroupText,
  InputGroupAddon,
  InputGroupInput,
} from "./input-group";

export interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value: number | null | undefined; // Value in cents
  onChange: (cents: number | null) => void; // Callback receives cents
  disabled?: boolean;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onChange, onFocus, disabled, ...props }, ref) => {
    // Convert cents to dollars for display
    const displayValue = React.useMemo(() => {
      if (value == null || value === 0) return "";
      const dollars = value / 100;
      return dollars.toFixed(2);
    }, [value]);

    const [inputValue, setInputValue] = React.useState(displayValue);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const isFocusedRef = React.useRef(false);

    // Sync input value when external value changes, but only if not focused
    React.useEffect(() => {
      if (!isFocusedRef.current) {
        setInputValue(displayValue);
      }
    }, [displayValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      const target = e.currentTarget;
      // When focused, show raw numeric value for editing
      if (value != null && value > 0) {
        const dollars = value / 100;
        // Show value without trailing zeros only if it's a whole number
        const displayStr =
          dollars % 1 === 0 ? dollars.toString() : dollars.toFixed(2);
        setInputValue(displayStr);
        target.setSelectionRange(0, displayStr.length);
      } else {
        setInputValue("");
      }
      onFocus?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal point, and numbers
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        ".",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey || e.metaKey) {
        if (["a", "c", "v", "x"].includes(e.key.toLowerCase())) {
          return;
        }
      }

      // Check if it's a number (0-9)
      const isNumber = /^[0-9]$/.test(e.key);

      // If not an allowed key and not a number, prevent input
      if (!allowedKeys.includes(e.key) && !isNumber) {
        e.preventDefault();
      }

      // Prevent multiple decimal points
      if (e.key === "." && inputValue.includes(".")) {
        e.preventDefault();
      }
    };

    const handleBlur = () => {
      isFocusedRef.current = false;
      // On blur, format to 2 decimal places
      if (value != null && value > 0) {
        setInputValue(displayValue);
      } else {
        setInputValue("");
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Only allow numbers and decimal point
      const numericStr = input.replace(/[^0-9.]/g, "");

      // Prevent multiple decimal points
      const parts = numericStr.split(".");
      if (parts.length > 2) {
        return;
      }

      // Limit to 2 decimal places (but don't force them while typing)
      if (parts[1] && parts[1].length > 2) {
        return;
      }

      setInputValue(numericStr);

      if (numericStr === "" || numericStr === ".") {
        onChange(null);
        return;
      }

      // Parse as dollars and convert to cents
      const dollars = parseFloat(numericStr);
      if (!isNaN(dollars) && dollars >= 0) {
        const cents = Math.round(dollars * 100);
        onChange(cents);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");

      // Filter to only numbers and decimal point
      const numericStr = pastedText.replace(/[^0-9.]/g, "");

      // Prevent multiple decimal points
      const parts = numericStr.split(".");
      const filteredStr =
        parts.length > 2
          ? parts[0] + "." + parts.slice(1).join("")
          : numericStr;

      // Limit to 2 decimal places
      const finalParts = filteredStr.split(".");
      const finalStr =
        finalParts[1] && finalParts[1].length > 2
          ? finalParts[0] + "." + finalParts[1].slice(0, 2)
          : filteredStr;

      setInputValue(finalStr);

      if (finalStr === "" || finalStr === ".") {
        onChange(null);
        return;
      }

      const dollars = parseFloat(finalStr);
      if (!isNaN(dollars) && dollars >= 0) {
        const cents = Math.round(dollars * 100);
        onChange(cents);
      }
    };

    return (
      <InputGroup className={cn(disabled && "opacity-50", className)}>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          ref={ref ?? inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="0.00"
          className="text-end"
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>AUD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    );
  },
);
MoneyInput.displayName = "MoneyInput";

export { MoneyInput };
