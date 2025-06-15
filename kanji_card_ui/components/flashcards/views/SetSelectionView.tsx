import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutContainer } from "../components/LayoutContainer";
import { CardFan } from "../components/CardFan";
import { SetList, ViewMode, Collection, CardSet } from "../types";
import { Toolbar } from "../components/Toolbar";

interface SetSelectionViewProps {
  setViewMode: (mode: ViewMode) => void;
  setCurrentSetIndex: (index: number) => void;
  setCurrentWordIndex: (index: number) => void;
  selectedSetList: SetList;
  setSelectedSet: (set: CardSet) => void;
  setCollection: (collection: Collection) => void;
}

export const SetSelectionView = ({
  setViewMode,
  setCurrentSetIndex,
  setCurrentWordIndex,
  selectedSetList,
  setSelectedSet,
  setCollection,
}: SetSelectionViewProps) => {
  const sets = selectedSetList.sets;

  return (
    <LayoutContainer>
      <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
        <Toolbar>
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => setViewMode("pool")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Все карточки
            </Button>
          </div>
        </Toolbar>

        <div className="grid grid-cols-4">
          {sets.map((set, index) => (
            <CardFan
              key={set.id}
              words={set.words}
              delay={index * 100}
              onClick={() => {
                setCurrentSetIndex(index);
                setCurrentWordIndex(0);
                setSelectedSet({
                  type: selectedSetList.type,
                  set: set,
                });
                setCollection(selectedSetList.type);
                setViewMode("study");
              }}
            />
          ))}
        </div>
      </div>
    </LayoutContainer>
  );
};
