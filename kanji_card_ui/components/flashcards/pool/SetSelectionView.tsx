import { ArrowLeft } from "lucide-react";
import React from "react";
import { Button } from "@fluentui/react-components";
import { LayoutContainer } from "../../ui/LayoutContainer";
import { CardFan } from "./components/CardFan";
import { SetList, CardSet } from "../shared";
import { Toolbar } from "../../ui/Toolbar";

interface SetSelectionViewProps {
  selectedSetList: SetList;
  setSelectedSet: (set: CardSet) => void;
  onBackToPool: () => void;
}

export const SetSelectionView = ({
  selectedSetList,
  setSelectedSet,
  onBackToPool,
}: SetSelectionViewProps) => {
  const sets = selectedSetList.sets;

  return (
    <LayoutContainer>
      <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
        <Toolbar>
            <div className="flex items-center justify-between h-16">
            <Button appearance="subtle" onClick={onBackToPool}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Все карточки
            </Button>
          </div>
        </Toolbar>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sets.map((set, index) => (
            <CardFan
              key={set.id}
              words={set.words}
              delay={index * 100}
              onClick={() => {
                const cardSet = {
                  type: selectedSetList.type,
                  set: set,
                };
                setSelectedSet(cardSet);
              }}
            />
          ))}
        </div>
      </div>
    </LayoutContainer>
  );
};
