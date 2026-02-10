/**
 * ICD-10 Code Search Component
 * 
 * Autocomplete search for ICD-10 diagnosis codes
 * Features: Fast search, popular codes, common Indian codes
 * Phase: 3D (Diagnosis Frontend)
 */

import React, { useState, useEffect } from 'react';
import { AutoComplete, Typography, Tag, Space, Spin, Empty } from 'antd';
import { SearchOutlined, StarOutlined, GlobalOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { ICD10SearchResult } from '@/types';
import { searchICD10Codes, getPopularICD10Codes, getCommonIndianCodes } from '@/services/diagnosisApi';
import './ICD10Search.css';

const { Text } = Typography;

interface ICD10SearchProps {
  value?: string;
  onChange?: (code: string, description: string) => void;
  onSelect?: (code: string, option: ICD10SearchResult) => void;
  placeholder?: string;
  showPopular?: boolean;
  commonOnly?: boolean;
  disabled?: boolean;
}

export const ICD10Search: React.FC<ICD10SearchProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search ICD-10 codes (e.g., diabetes, fever)',
  showPopular = true,
  commonOnly = true,
  disabled = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Search ICD-10 codes
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['icd10-search', searchQuery, commonOnly],
    queryFn: () => searchICD10Codes(searchQuery, 15, commonOnly),
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Popular codes (show when no search)
  const { data: popularCodes } = useQuery({
    queryKey: ['icd10-popular'],
    queryFn: () => getPopularICD10Codes(10),
    enabled: showPopular && !searchQuery,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Common Indian codes
  const { data: commonCodes } = useQuery({
    queryKey: ['icd10-common-indian'],
    queryFn: () => getCommonIndianCodes(10),
    enabled: showPopular && !searchQuery,
    staleTime: 30 * 60 * 1000,
  });

  // Render function for option display (must be defined before useMemo)
  const renderOption = (code: ICD10SearchResult) => (
    <div className="icd10-option">
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <Space>
          <Tag color="blue" style={{ margin: 0 }}>{code.code}</Tag>
          {code.common_in_india && (
            <Tag color="green" style={{ margin: 0 }}>India</Tag>
          )}
        </Space>
        <Text className="icd10-description">{code.description}</Text>
        {code.category && (
          <Text type="secondary" className="icd10-category">
            {code.category}
            {code.subcategory && ` • ${code.subcategory}`}
          </Text>
        )}
      </Space>
    </div>
  );

  // Prepare options for AutoComplete
  const options = React.useMemo(() => {
    if (searchQuery.length >= 2 && searchResults) {
      if (searchResults.length === 0) {
        return [];
      }
      return [{
        label: (
          <div className="icd10-search-group">
            <SearchOutlined /> Search Results ({searchResults.length})
          </div>
        ),
        options: searchResults.map(code => ({
          value: code.code,
          label: renderOption(code),
          code: code,
        })),
      }];
    }

    if (showPopular && !searchQuery) {
      const groups = [];
      
      if (popularCodes && popularCodes.length > 0) {
        groups.push({
          label: (
            <div className="icd10-search-group">
              <StarOutlined /> Popular Diagnoses
            </div>
          ),
          options: popularCodes.map(code => ({
            value: code.code,
            label: renderOption(code),
            code: code,
          })),
        });
      }

      if (commonCodes && commonCodes.length > 0) {
        groups.push({
          label: (
            <div className="icd10-search-group">
              <GlobalOutlined /> Common in India
            </div>
          ),
          options: commonCodes.slice(0, 5).map(code => ({
            value: code.code,
            label: renderOption(code),
            code: code,
          })),
        });
      }

      if (groups.length > 0) {
        return groups;
      }
    }

    return [];
  }, [searchQuery, searchResults, popularCodes, commonCodes, showPopular]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setOpen(value.length >= 2 || !value);
  };

  const handleSelect = (value: string, option: any) => {
    const selectedCode = option.code as ICD10SearchResult;
    
    if (onSelect) {
      onSelect(value, selectedCode);
    }
    
    if (onChange) {
      onChange(value, selectedCode.description);
    }
    
    setOpen(false);
    setSearchQuery('');
  };

  const handleFocus = () => {
    setOpen(true);
    // Clear any search to show popular codes
    if (!searchQuery) {
      setSearchQuery('');
    }
  };

  const handleBlur = () => {
    // Delay to allow option selection
    setTimeout(() => setOpen(false), 200);
  };

  return (
    <AutoComplete
      value={searchQuery || value}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onFocus={handleFocus}
      onBlur={handleBlur}
      open={open}
      placeholder={placeholder}
      disabled={disabled}
      allowClear
      notFoundContent={
        isSearching ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="small" />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Searching ICD-10 codes...</Text>
            </div>
          </div>
        ) : searchQuery.length >= 2 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No ICD-10 codes found. Try different keywords."
          />
        ) : searchQuery.length > 0 && searchQuery.length < 2 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">Type at least 2 characters to search...</Text>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">Type to search, or click to see popular codes</Text>
          </div>
        )
      }
      popupClassName="icd10-search-dropdown"
      filterOption={false}
      style={{ width: '100%' }}
    />
  );
};
