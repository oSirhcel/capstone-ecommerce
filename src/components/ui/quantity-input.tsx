"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export interface QuantityInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: number;
  onChange?: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimalPlaces?: number;
}

export const QuantityInput = React.forwardRef<
  HTMLInputElement,
  QuantityInputProps
>(
  (
    {
      className,
      value = 0,
      onChange,
      step = 0.5,
      min = 0,
      max,
      decimalPlaces = 2,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [displayValue, setDisplayValue] = React.useState(value.toString());

    // Update display value when prop value changes
    React.useEffect(() => {
      setDisplayValue(value.toString());
    }, [value]);

    const removeLeadingZeros = (str: string): string => {
      // Handle empty string
      if (!str) return "0";

      // Handle decimal numbers
      if (str.includes(".")) {
        const [intPart, decPart] = str.split(".");
        const cleanedInt = intPart.replace(/^0+/, "") || "0";
        return `${cleanedInt}.${decPart}`;
      }

      // Handle whole numbers
      return str.replace(/^0+/, "") || "0";
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty input
      if (input === "") {
        setDisplayValue("");
        return;
      }

      // Allow negative sign at the start
      if (input === "-") {
        setDisplayValue("-");
        return;
      }

      if (decimalPlaces === 0 && input.includes(".")) {
        return;
      }

      // Validate input: allow numbers, one decimal point, and negative sign
      const regex = new RegExp(`^-?\\d*\\.?\\d{0,${decimalPlaces}}$`);
      if (!regex.test(input)) {
        return;
      }

      let cleanedInput = input;

      // Don't clean if user is typing "0." or just "0"
      if (
        input !== "0" &&
        input !== "0." &&
        input !== "-0" &&
        input !== "-0."
      ) {
        // Remove leading zeros but preserve the decimal point
        if (input.includes(".")) {
          const [intPart, decPart] = input.split(".");
          const isNegative = intPart.startsWith("-");
          const cleanedInt = intPart.replace(/^-?0+/, "") || "0";
          cleanedInput = `${isNegative && cleanedInt !== "0" ? "-" : ""}${cleanedInt}.${decPart}`;
        } else {
          // For whole numbers, remove leading zeros
          const isNegative = input.startsWith("-");
          const withoutSign = input.replace("-", "");
          const cleanedNumber = withoutSign.replace(/^0+/, "") || "0";
          cleanedInput =
            isNegative && cleanedNumber !== "0"
              ? `-${cleanedNumber}`
              : cleanedNumber;
        }
      }

      setDisplayValue(cleanedInput);
    };

    const handleBlur = () => {
      // Parse the value on blur
      let numValue = Number.parseFloat(displayValue);

      // Handle invalid or empty input
      if (isNaN(numValue) || displayValue === "" || displayValue === "-") {
        numValue = min ?? 0;
      }

      // Apply min/max constraints
      if (min !== undefined && numValue < min) {
        numValue = min;
      }
      if (max !== undefined && numValue > max) {
        numValue = max;
      }

      // Round to specified decimal places
      numValue = Number.parseFloat(numValue.toFixed(decimalPlaces));

      // Update display with cleaned value
      const cleanedValue = removeLeadingZeros(numValue.toString());
      setDisplayValue(cleanedValue);

      // Notify parent
      onChange?.(numValue);
    };

    const handleIncrement = () => {
      const currentValue = Number.parseFloat(displayValue) || 0;
      let newValue = currentValue + step;

      // Apply max constraint
      if (max !== undefined && newValue > max) {
        newValue = max;
      }

      // Round to specified decimal places
      newValue = Number.parseFloat(newValue.toFixed(decimalPlaces));

      const cleanedValue = removeLeadingZeros(newValue.toString());
      setDisplayValue(cleanedValue);
      onChange?.(newValue);
    };

    const handleDecrement = () => {
      const currentValue = Number.parseFloat(displayValue) || 0;
      let newValue = currentValue - step;

      // Apply min constraint
      if (min !== undefined && newValue < min) {
        newValue = min;
      }

      // Round to specified decimal places
      newValue = Number.parseFloat(newValue.toFixed(decimalPlaces));

      const cleanedValue = removeLeadingZeros(newValue.toString());
      setDisplayValue(cleanedValue);
      onChange?.(newValue);
    };

    return (
      <InputGroup className={cn(className)}>
        <InputGroupInput
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          disabled={disabled}
          {...props}
        />
        <InputGroupAddon align="inline-end" className="pr-0">
          <div className="flex flex-col">
            <InputGroupButton
              type="button"
              variant="secondary"
              onClick={handleIncrement}
              disabled={
                disabled ??
                (max !== undefined && Number.parseFloat(displayValue) >= max)
              }
              tabIndex={-1}
              aria-label="Increment"
              className="h-3 w-6 rounded-b-none"
            >
              <ChevronUp className="h-3 w-3" />
            </InputGroupButton>
            <InputGroupButton
              type="button"
              variant="secondary"
              onClick={handleDecrement}
              disabled={
                disabled ??
                (min !== undefined && Number.parseFloat(displayValue) <= min)
              }
              className="h-3 w-6 rounded-t-none"
              tabIndex={-1}
              aria-label="Decrement"
            >
              <ChevronDown className="h-3 w-3" />
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
    );
  },
);

QuantityInput.displayName = "QuantityInput";
