// frontend/src/components/trade/StockDropdown.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Select, Spin } from 'antd';
import { useLazySearchStocksQuery } from '../../store/api/stocksApi';

const StockDropdown = ({ value, onChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerSearch, { data, isFetching }] = useLazySearchStocksQuery();

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 2) {
        triggerSearch(searchTerm);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, triggerSearch]);

  const options = useMemo(() => {
    const items = data?.data || [];
    return items.map((item) => ({
      label: `${item.code_id} — ${item.name}`,
      value: item.code_id,
      name: item.name,
    }));
  }, [data]);

  return (
    <Select
      showSearch
      value={value}
      disabled={disabled}
      filterOption={false}
      onSearch={(val) => setSearchTerm(val)}
      onSelect={(val, option) => onChange(val, option.name)}
      options={options}
      notFoundContent={
        isFetching ? <Spin size="small" /> : searchTerm.length < 2 ? 'Type to search stocks...' : 'No stocks found'
      }
    />
  );
};

export default StockDropdown;
