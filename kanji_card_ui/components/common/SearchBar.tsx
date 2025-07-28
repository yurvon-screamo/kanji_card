import { Box, Input, IconButton, Spinner } from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { LuSearch, LuX } from "react-icons/lu";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounceMs?: number;
  size?: "sm" | "md" | "lg";
  variant?: "outline" | "subtle" | "flushed";
  showClearButton?: boolean;
  width?: string | number;
  maxWidth?: string | number;
}

export const SearchBar = ({
  value = "",
  onChange,
  onSearch,
  placeholder = "Поиск...",
  isLoading = false,
  debounceMs = 300,
  size = "md",
  variant = "outline",
  showClearButton = true,
  width = "full",
  maxWidth = "md",
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs]);

  // Вызов onSearch при изменении дебаунсированного значения
  useEffect(() => {
    if (onSearch && debouncedValue !== value) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch, value]);

  // Синхронизация с внешним value
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setInputValue(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onChange?.("");
    onSearch?.("");
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onSearch?.(inputValue);
      } else if (event.key === "Escape") {
        event.preventDefault();
        handleClear();
      }
    },
    [inputValue, onSearch, handleClear],
  );

  const showClear = showClearButton && inputValue.length > 0;

  return (
    <Box width={width} maxWidth={maxWidth} position="relative">
      {/* Search icon */}
      <Box
        position="absolute"
        left={3}
        top="50%"
        transform="translateY(-50%)"
        zIndex={2}
        pointerEvents="none"
      >
        {isLoading ? (
          <Spinner size="sm" color="gray.400" />
        ) : (
          <LuSearch size={16} color="var(--chakra-colors-gray-400)" />
        )}
      </Box>

      <Input
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        variant={variant}
        size={size}
        pl={10}
        pr={showClear ? 10 : 4}
      />

      {/* Clear button */}
      {showClear && (
        <Box
          position="absolute"
          right={2}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
        >
          <IconButton
            aria-label="Очистить поиск"
            size="xs"
            variant="ghost"
            onClick={handleClear}
            color="gray.400"
            _hover={{ color: "gray.600" }}
          >
            <LuX size={14} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

// Компонент для быстрого поиска без дебаунса
export const QuickSearchBar = (props: Omit<SearchBarProps, "debounceMs">) => (
  <SearchBar {...props} debounceMs={0} />
);

// Компонент для поиска с медленным дебаунсом
export const SlowSearchBar = (props: Omit<SearchBarProps, "debounceMs">) => (
  <SearchBar {...props} debounceMs={800} />
);
