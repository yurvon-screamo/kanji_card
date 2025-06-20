import React from "react";
import { Button } from "@fluentui/react-components";
import { Toolbar } from "../../../ui/Toolbar";

interface EmptySetViewProps {
  onBackToPool: () => void;
}

export function EmptySetView({ onBackToPool }: EmptySetViewProps) {
  return (
    <>
      <Toolbar>
        <div className="flex space-x-2">
          <Button appearance="subtle" onClick={onBackToPool}>
            Все карточки
          </Button>
        </div>
      </Toolbar>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Нет доступных наборов
          </h2>
          <p className="text-gray-600 mb-4">
            В данной категории пока нет наборов для изучения
          </p>
        </div>
      </div>
    </>
  );
}