import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { LuArrowLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "next/navigation";

export interface BreadcrumbItemType {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  showBackButton = false,
  onBack,
  actions,
  children,
  size = "md",
}: PageHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const getTitleSize = () => {
    switch (size) {
      case "sm":
        return "md" as const;
      case "lg":
        return "xl" as const;
      default:
        return "lg" as const;
    }
  };

  const getSpacing = () => {
    switch (size) {
      case "sm":
        return 3;
      case "lg":
        return 6;
      default:
        return 4;
    }
  };

  return (
    <Box mb={getSpacing()}>
      {/* Хлебные крошки */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <HStack gap={2} fontSize="sm" color="gray.600" mb={3}>
          {breadcrumbs.map((crumb, index) => (
            <HStack key={index} gap={2}>
              {crumb.href && !crumb.isCurrentPage ? (
                <a
                  href={crumb.href}
                  style={{
                    color: "var(--chakra-colors-blue-500)",
                    fontSize: "0.875rem",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {crumb.label}
                </a>
              ) : (
                <Text
                  color={crumb.isCurrentPage ? "gray.900" : "gray.600"}
                  fontWeight={crumb.isCurrentPage ? "medium" : "normal"}
                >
                  {crumb.label}
                </Text>
              )}
              {index < breadcrumbs.length - 1 && (
                <LuChevronRight color="gray.500" size={14} />
              )}
            </HStack>
          ))}
        </HStack>
      )}

      <Flex justify="space-between" align="flex-start" gap={4}>
        {/* Левая часть: назад кнопка + заголовок */}
        <HStack align="flex-start" gap={3} flex={1}>
          {showBackButton && (
            <IconButton
              aria-label="Назад"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              mt={1}
            >
              <LuArrowLeft />
            </IconButton>
          )}

          <VStack align="stretch" gap={description ? 2 : 0} flex={1}>
            <Heading size={getTitleSize()} color="gray.900">
              {title}
            </Heading>
            {description && (
              <Text color="gray.600" fontSize={size === "lg" ? "md" : "sm"}>
                {description}
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Правая часть: действия */}
        {actions && <Box flexShrink={0}>{actions}</Box>}
      </Flex>

      {/* Дополнительный контент */}
      {children && <Box mt={getSpacing()}>{children}</Box>}
    </Box>
  );
};

// Вспомогательные компоненты для действий
export const PageHeaderActions = ({ children }: { children: ReactNode }) => (
  <HStack gap={2}>{children}</HStack>
);

export const PageHeaderAction = ({
  children,
  ...props
}: { children: ReactNode } & React.ComponentProps<typeof Button>) => (
  <Button size="sm" {...props}>
    {children}
  </Button>
);
