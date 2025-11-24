import React, { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const SearchInput = React.memo(({ 
  value, 
  onChange, 
  onSearch, 
  onClear, 
  placeholder, 
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleClear = () => {
    onChange('');
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={itemsPerPage}
            onChange={onItemsPerPageChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
    </div>
  );
});

export default SearchInput;