'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RuleResponse, RuleDetailResponse, DefaultService } from '@/api';
import { LayoutContainer } from '../../ui/LayoutContainer';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { RulesToolbar } from './RulesToolbar';
import { RulesGridMode } from './RulesGridMode';
import { RuleDetailMode } from './RuleDetailMode';
import { RuleTestMode } from './RuleTestMode';
import { AddRuleForm } from './AddRuleForm';

type ViewMode = 'grid' | 'detail' | 'test' | 'add';

export const RulesView = () => {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [rules, setRules] = useState<RuleResponse[]>([]);
    const [selectedRule, setSelectedRule] = useState<RuleDetailResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Загрузка списка правил
    const loadRules = async (search?: string) => {
        setIsLoading(true);
        try {
            const response = await DefaultService.listRules(search ?? "");
            setRules(response);
        } catch (error) {
            console.error('Error loading rules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Загрузка деталей правила
    const loadRuleDetail = async (ruleId: string) => {
        setIsLoading(true);
        try {
            const response = await DefaultService.getRule(ruleId);
            setSelectedRule(response);
            setViewMode('detail');
        } catch (error) {
            console.error('Error loading rule detail:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Обработчики
    const handleBack = () => {
        if (viewMode === 'test') {
            setViewMode('detail');
        } else if (viewMode === 'detail') {
            setViewMode('grid');
            setSelectedRule(null);
        } else if (viewMode === 'add') {
            setViewMode('grid');
        } else {
            router.push('/');
        }
    };

    const handleRuleClick = (ruleId: string) => {
        loadRuleDetail(ruleId);
    };

    const handleStartTest = () => {
        setViewMode('test');
    };

    const handleTestComplete = () => {
        setViewMode('detail');
    };

    const handleAddRule = () => {
        setViewMode('add');
    };

    const handleRuleAdded = () => {
        setViewMode('grid');
        loadRules(); // Reload rules to show the new one
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        loadRules(query);
    };

    const handleRuleUpdated = (updatedRule: RuleDetailResponse) => {
        setSelectedRule(updatedRule);
        // Обновляем правило в списке
        setRules(prevRules =>
            prevRules.map(rule =>
                rule.id === updatedRule.id
                    ? { ...rule, is_released: updatedRule.is_released, release_time: updatedRule.release_time }
                    : rule
            )
        );
    };

    // Загрузка данных при монтировании
    useEffect(() => {
        loadRules();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        switch (viewMode) {
            case 'grid':
                return (
                    <RulesGridMode
                        rules={rules}
                        onRuleClick={handleRuleClick}
                        onAddRule={handleAddRule}
                    />
                );
            case 'detail':
                return selectedRule ? (
                    <RuleDetailMode
                        rule={selectedRule}
                        onStartTest={handleStartTest}
                        onRuleUpdated={handleRuleUpdated}
                    />
                ) : null;
            case 'test':
                return selectedRule ? (
                    <RuleTestMode
                        tests={selectedRule.tests}
                        onComplete={handleTestComplete}
                    />
                ) : null;
            case 'add':
                return (
                    <AddRuleForm
                        onRuleAdded={handleRuleAdded}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <LayoutContainer>
            <div className="flex justify-center">
                <div className="w-full space-y-12 max-w-screen-lg mx-auto px-4">
                    <RulesToolbar
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        onBack={handleBack}
                        onSearchChange={handleSearchChange}
                        showSearch={viewMode === 'grid'}
                    />
                    {renderContent()}
                </div>
            </div>
        </LayoutContainer>
    );
};