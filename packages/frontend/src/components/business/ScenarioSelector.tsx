/**
 * Scenario Selector Component
 * Allows users to select recommendation scenarios
 * T149: Implement scenario selector UI
 */

import React, { useState, useEffect } from 'react';
import { Select, Tag } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { getScenarios, type ScenarioConfig } from '@/services/api/recommendations';

interface ScenarioSelectorProps {
  value?: string;
  onChange?: (scenario: string) => void;
}

/**
 * Scenario Selector Component
 */
const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ value, onChange }) => {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string>('any');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const data = await getScenarios();
      setScenarios(data.scenarios);
      setCurrentScenario(data.current_scenario);
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (scenario: string) => {
    if (onChange) {
      onChange(scenario);
    }
  };

  const getScenarioIcon = (scenario: string) => {
    const icons: Record<string, string> = {
      commute: '🚇',
      break_time: '☕',
      bedtime: '🌙',
      weekend: '🎮',
      any: '🎯',
    };
    return icons[scenario] || '🎮';
  };

  const getScenarioLabel = (scenario: string) => {
    const labels: Record<string, string> = {
      commute: '通勤时间',
      break_time: '休息时间',
      bedtime: '睡前放松',
      weekend: '周末畅玩',
      any: '全部推荐',
    };
    return labels[scenario] || scenario;
  };

  return (
    <div className="scenario-selector" data-testid="scenario-selector">
      <Select
        value={value || currentScenario}
        onChange={handleChange}
        loading={loading}
        style={{ width: 200 }}
        size="large"
        suffixIcon={<ClockCircleOutlined />}
        data-testid="scenario-select"
      >
        <Select.Option value="any" key="any">
          <span className="mr-2">{getScenarioIcon('any')}</span>
          {getScenarioLabel('any')}
        </Select.Option>
        {scenarios.map((scenario) => (
          <Select.Option value={scenario.scenario} key={scenario.scenario}>
            <span className="mr-2">{getScenarioIcon(scenario.scenario)}</span>
            {getScenarioLabel(scenario.scenario)}
            {scenario.scenario === currentScenario && (
              <Tag color="blue" className="ml-2" data-testid="current-tag">
                当前
              </Tag>
            )}
          </Select.Option>
        ))}
      </Select>

      {/* Scenario Description */}
      {value && (
        <div className="mt-2 text-sm text-gray-600">
          {scenarios.find((s) => s.scenario === value)?.description}
        </div>
      )}
    </div>
  );
};

export default ScenarioSelector;

