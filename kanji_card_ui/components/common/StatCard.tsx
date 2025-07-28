import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Heading,
  Icon,
  Button,
} from "@chakra-ui/react";
import { ReactElement } from "react";
import { LuTrendingUp, LuTrendingDown, LuMinus } from "react-icons/lu";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactElement;
  trend?: {
    value: number;
    label?: string;
  };
  colorScheme?: "blue" | "green" | "red" | "orange" | "purple" | "gray";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  actionLabel?: string;
  isLoading?: boolean;
  variant?: "outline" | "filled" | "elevated";
}

export const StatCard = ({
  label,
  value,
  description,
  icon,
  trend,
  colorScheme = "blue",
  size = "md",
  onClick,
  actionLabel,
  isLoading = false,
  variant = "elevated",
}: StatCardProps) => {
  const getSizeProps = () => {
    switch (size) {
      case "sm":
        return {
          padding: 4,
          valueSize: "lg" as const,
          labelSize: "sm" as const,
          iconSize: 5,
        };
      case "lg":
        return {
          padding: 8,
          valueSize: "3xl" as const,
          labelSize: "md" as const,
          iconSize: 8,
        };
      default:
        return {
          padding: 6,
          valueSize: "2xl" as const,
          labelSize: "sm" as const,
          iconSize: 6,
        };
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.value > 0) return LuTrendingUp;
    if (trend.value < 0) return LuTrendingDown;
    return LuMinus;
  };

  const getTrendColor = () => {
    if (!trend) return "gray.500";

    if (trend.value > 0) return "green.500";
    if (trend.value < 0) return "red.500";
    return "gray.500";
  };

  const sizeProps = getSizeProps();
  const TrendIcon = getTrendIcon();

  const getCardVariantProps = () => {
    switch (variant) {
      case "outline":
        return {
          variant: "outline" as const,
        };
      case "filled":
        return {
          variant: "filled" as const,
          bg: `${colorScheme}.50`,
        };
      default:
        return {
          variant: "elevated" as const,
        };
    }
  };

  const cardProps = {
    ...getCardVariantProps(),
    _hover: onClick
      ? {
          shadow: "md",
          transform: "translateY(-1px)",
          transition: "all 0.2s",
        }
      : undefined,
    cursor: onClick ? "pointer" : "default",
  };

  return (
    <Box {...cardProps} onClick={onClick}>
      <Box p={sizeProps.padding}>
        <VStack align="stretch" gap={sizeProps.padding === 4 ? 2 : 3}>
          {/* Заголовок и иконка */}
          <Flex justify="space-between" align="flex-start">
            <VStack align="stretch" gap={1} flex={1}>
              <Text
                fontSize={sizeProps.labelSize}
                fontWeight="medium"
                color="gray.600"
                lineHeight="short"
              >
                {label}
              </Text>

              {description && (
                <Text fontSize="xs" color="gray.500" lineHeight="short">
                  {description}
                </Text>
              )}
            </VStack>

            {icon && (
              <Box
                p={2}
                borderRadius="lg"
                bg={`${colorScheme}.100`}
                color={`${colorScheme}.600`}
              >
                {icon}
              </Box>
            )}
          </Flex>

          {/* Основное значение */}
          <Heading
            size={sizeProps.valueSize}
            color="gray.900"
            fontWeight="bold"
            lineHeight="shorter"
          >
            {isLoading ? "—" : value}
          </Heading>

          {/* Тренд или действие */}
          {trend && !isLoading && (
            <HStack gap={2}>
              {TrendIcon && (
                <Icon as={TrendIcon} boxSize={4} color={getTrendColor()} />
              )}
              <Text fontSize="sm" color={getTrendColor()} fontWeight="medium">
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </Text>
              {trend.label && (
                <Text fontSize="sm" color="gray.500">
                  {trend.label}
                </Text>
              )}
            </HStack>
          )}

          {actionLabel && onClick && !isLoading && (
            <Button
              size="sm"
              variant="outline"
              colorScheme={colorScheme}
              alignSelf="flex-start"
            >
              {actionLabel}
            </Button>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

// Предустановленные варианты
export const MetricCard = (props: Omit<StatCardProps, "variant">) => (
  <StatCard {...props} variant="elevated" />
);

export const CompactStatCard = (props: Omit<StatCardProps, "size">) => (
  <StatCard {...props} size="sm" />
);

export const LargeStatCard = (props: Omit<StatCardProps, "size">) => (
  <StatCard {...props} size="lg" />
);
