import { ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button, Text, Divider } from "@fluentui/react-components";
import { LayoutContainer } from "../../ui/LayoutContainer";
import { SetList, CardSet, Collection, Set } from "../shared";
import { Toolbar } from "../../ui/Toolbar";
import { WordRepository } from "../shared/repository";
import { SetCard } from "./SetCard";

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
  const [currentSetsData, setCurrentSetsData] = useState<{
    needToLearn: Set[];
    toFeature: Set[];
    wordCountToLearn: number;
    wordCountToFeature: number;
  } | null>(null);

  useEffect(() => {
    if (selectedSetList.type === Collection.IN_PROGRESS) {
      loadCurrentSetsData();
    }
  }, [selectedSetList.type]);

  const loadCurrentSetsData = async () => {
    try {
      const repository = WordRepository.getInstance();
      const currentSets = await repository.getInProgressSets();
      setCurrentSetsData({
        needToLearn: currentSets.needToLearn,
        toFeature: currentSets.toFeature,
        wordCountToLearn: currentSets.wordCountToLearn,
        wordCountToFeature: currentSets.wordCountToFeature,
      });
    } catch (error) {
      console.error("Error loading current sets data:", error);
    }
  };

  const groupSetsByStatus = (sets: Set[]) => {
    const groups: { [key: string]: Set[] } = {};
    sets.forEach(set => {
      const status = set.state;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(set);
    });
    return groups;
  };

  const getStatusDisplayName = (status: Collection): string => {
    switch (status) {
      case Collection.IN_PROGRESS:
        return 'В процессе';
      case Collection.NEW:
        return 'Новые';
      default:
        return status;
    }
  };

  const renderSets = () => {
    if (selectedSetList.type === Collection.IN_PROGRESS && currentSetsData) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {currentSetsData.needToLearn.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Text size={500} weight="semibold">
                Учить <span style={{ color: "#888", fontWeight: "normal" }}>{currentSetsData.wordCountToLearn} слов</span>
              </Text>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                alignItems: 'stretch',
                gap: 32,
              }}>
                {currentSetsData.needToLearn.map((set) => (
                  <SetCard
                    key={set.id}
                    set={set}
                    onClick={() => setSelectedSet({ type: selectedSetList.type, set })}
                  />
                ))}
              </div>
            </div>
          )}
          {currentSetsData.toFeature.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Text size={500} weight="semibold">
                На будущее <span style={{ color: "#888", fontWeight: "normal" }}>{currentSetsData.wordCountToFeature} слов</span>
              </Text>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 32,
                alignItems: 'stretch',
              }}>
                {currentSetsData.toFeature.map((set) => (
                  <SetCard
                    key={set.id}
                    set={set}
                    onClick={() => setSelectedSet({ type: selectedSetList.type, set })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Для других типов показываем группированный список
    const groupedSets = groupSetsByStatus(selectedSetList.sets);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {Object.entries(groupedSets).map(([status, sets]) => (
          <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Text size={500} weight="semibold">{getStatusDisplayName(status as Collection)} ({sets.length})</Text>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 32,
              alignItems: 'stretch',
            }}>
              {sets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  onClick={() => setSelectedSet({ type: selectedSetList.type, set })}
                />
              ))}
            </div>
            <Divider />
          </div>
        ))}
      </div>
    );
  };

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
        {renderSets()}
      </div>
    </LayoutContainer>
  );
};
