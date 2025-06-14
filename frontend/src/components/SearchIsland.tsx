import React, { useEffect } from 'react';
import { FiSearch, FiFilter, FiCalendar } from 'react-icons/fi';
import { FaSort } from 'react-icons/fa6';
import { MdOutlineGridView, MdOutlineViewAgenda, MdOutlineAdd } from 'react-icons/md';

// Custom 4x4 grid icon component (16 squares)
const QuadGridIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="4" height="4" rx="0.5" />
    <rect x="8" y="2" width="4" height="4" rx="0.5" />
    <rect x="14" y="2" width="4" height="4" rx="0.5" />
    <rect x="20" y="2" width="2" height="4" rx="0.5" />
    <rect x="2" y="8" width="4" height="4" rx="0.5" />
    <rect x="8" y="8" width="4" height="4" rx="0.5" />
    <rect x="14" y="8" width="4" height="4" rx="0.5" />
    <rect x="20" y="8" width="2" height="4" rx="0.5" />
    <rect x="2" y="14" width="4" height="4" rx="0.5" />
    <rect x="8" y="14" width="4" height="4" rx="0.5" />
    <rect x="14" y="14" width="4" height="4" rx="0.5" />
    <rect x="20" y="14" width="2" height="4" rx="0.5" />
    <rect x="2" y="20" width="4" height="2" rx="0.5" />
    <rect x="8" y="20" width="4" height="2" rx="0.5" />
    <rect x="14" y="20" width="4" height="2" rx="0.5" />
    <rect x="20" y="20" width="2" height="2" rx="0.5" />
  </svg>
);

// Props'ları Home'dan alacağımız state ve fonksiyonlara göre ayarlayacağız
interface SearchIslandProps {
  postType: 'all' | 'lost' | 'found';
  setPostType: (type: 'all' | 'lost' | 'found') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  datePopoverOpen: boolean;
  setDatePopoverOpen: (v: boolean) => void;
  dateStart: string;
  setDateStart: (v: string) => void;
  dateEnd: string;
  setDateEnd: (v: string) => void;
  calendarRef: React.RefObject<HTMLDivElement | null>;
  filterPopoverOpen: boolean;
  setFilterPopoverOpen: (v: boolean) => void;
  filterSearch: string;
  setFilterSearch: (v: string) => void;
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (v: string[]) => void;
  locations: {id: number, name: string, nameEn: string}[];
  selectedLocations: string[];
  setSelectedLocations: (v: string[]) => void;
  sortOrder: 'desc' | 'asc';
  setSortOrder: (v: 'desc' | 'asc') => void;
  sortPopoverOpen: boolean;
  setSortPopoverOpen: (v: boolean) => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
  sortSelectedOnOpen: boolean;
  setSortSelectedOnOpen: (v: boolean) => void;
  viewMode: 'quad' | 'double' | 'single';
  setViewMode: (v: 'quad' | 'double' | 'single') => void;
  onNewPost: () => void;
}

const SearchIsland: React.FC<SearchIslandProps> = ({
  postType, setPostType, searchQuery, setSearchQuery,
  datePopoverOpen, setDatePopoverOpen, dateStart, setDateStart, dateEnd, setDateEnd, calendarRef,
  filterPopoverOpen, setFilterPopoverOpen, filterSearch, setFilterSearch,
  categories, selectedCategories, setSelectedCategories,
  locations, selectedLocations, setSelectedLocations,
  sortOrder, setSortOrder, sortPopoverOpen, setSortPopoverOpen, sortRef, sortSelectedOnOpen, setSortSelectedOnOpen,
  viewMode, setViewMode, onNewPost
}) => {
  // Bugünün tarihi (yyyy-mm-dd)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      // Eğer tıklanan element bir input veya label ise modalı kapatma
      if (target.tagName === 'INPUT' || target.tagName === 'LABEL') {
        return;
      }
      if (datePopoverOpen && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setDatePopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePopoverOpen, calendarRef, setDatePopoverOpen]);

  return (
    <div className="sticky top-0 z-30 bg-white bg-opacity-95 backdrop-blur shadow-md rounded-b-xl mb-6">
      {/* Masaüstü (web) görünümü */}
      <div className="hidden md:flex flex-row items-center justify-between gap-2 p-3 w-full">
        {/* Sol: Lost/Found/All */}
        <div className="flex items-center bg-gray-50 rounded-lg">
          <button
            onClick={() => setPostType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${postType === 'all' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
          >All</button>
          <button
            onClick={() => setPostType('lost')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${postType === 'lost' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
          >Lost</button>
          <button
            onClick={() => setPostType('found')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${postType === 'found' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
          >Found</button>
        </div>
        {/* Orta: Search, Calendar, Filter */}
        <div className="flex items-center flex-1 gap-2 min-w-0 mx-2">
          <div className="flex items-center flex-1 bg-gray-100 rounded-xl border border-white/70 px-4 min-h-[38px] h-[42px] focus-within:border-[#801d21] transition-colors relative">
            <FiSearch className="text-2xl text-gray-600 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for lost items..."
              className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 text-base"
            />
          </div>
          <div className="relative flex items-center">
            <FiCalendar
              className={`text-2xl cursor-pointer hover:text-gray-800 transition-colors ${((dateStart && dateStart.trim()) || (dateEnd && dateEnd.trim())) ? 'text-[#9a0e20]' : 'text-gray-600'}`}
              onClick={() => setDatePopoverOpen(!datePopoverOpen)}
            />
            {datePopoverOpen && (
              <div ref={calendarRef} className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">Date Range</div>
                  {((dateStart && dateStart.trim()) || (dateEnd && dateEnd.trim())) && (
                    <button
                      onClick={() => { setDateStart(''); setDateEnd(''); }}
                      className="text-sm text-[#9a0e20] hover:text-[#801d21] font-medium cursor-pointer"
                    >Clear all</button>
                  )}
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start</label>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={e => setDateStart(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20]"
                      placeholder="gg.aa.yyyy"
                      max={dateEnd && dateEnd < today ? dateEnd : today}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={e => setDateEnd(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20]"
                      placeholder="gg.aa.yyyy"
                      min={dateStart || undefined}
                      max={today}
                    />
                  </div>
                </div>
                <button
                  className="w-full bg-[#9a0e20] text-white rounded-lg py-2 font-semibold hover:bg-[#801d21] transition-colors cursor-pointer"
                  onClick={() => setDatePopoverOpen(false)}
                >Apply</button>
              </div>
            )}
          </div>
          <div className="relative flex items-center">
            <FiFilter
              className={`text-2xl cursor-pointer hover:text-gray-800 transition-colors ${(selectedCategories.length > 0 || selectedLocations.length > 0) && !filterPopoverOpen ? 'text-[#761a1e]' : 'text-gray-600'}`}
              onClick={() => {
                const next = !filterPopoverOpen;
                setFilterPopoverOpen(next);
                if (next) {
                  setFilterSearch("");
                  setSortSelectedOnOpen(true);
                }
              }}
            />
            {filterPopoverOpen && (
              <div ref={calendarRef} className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">Filters</div>
                  {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedLocations([]);
                      }}
                      className="text-sm text-[#9a0e20] hover:text-[#801d21] font-medium"
                    >Clear all</button>
                  )}
                </div>
                <div className="flex items-center mb-3 bg-gray-100 rounded px-2 py-1">
                  <FiSearch className="text-gray-500 mr-2 text-sm" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-sm flex-1 text-gray-800 placeholder-gray-400"
                  />
                </div>
                <div className="mb-2">
                  <div className="font-semibold text-gray-700 text-sm mb-1">Categories</div>
                  <div className="max-h-80 overflow-y-auto border-b pb-2 mb-2">
                    {(() => {
                      const filtered = categories.filter(cat => cat.toLowerCase().includes(filterSearch.toLowerCase()));
                      let ordered;
                      if (sortSelectedOnOpen) {
                        const selected = filtered.filter(cat => selectedCategories.includes(cat));
                        const unselected = filtered.filter(cat => !selectedCategories.includes(cat));
                        ordered = [...selected, ...unselected];
                      } else {
                        ordered = filtered;
                      }
                      return ordered.map((cat, index) => (
                        <div
                          key={`category-${cat || index}`}
                          className={`px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-gray-800 flex items-center justify-between ${selectedCategories.includes(cat) ? 'font-semibold text-[#9a0e20]' : ''}`}
                          onClick={() => {
                            setSelectedCategories(selectedCategories.includes(cat)
                              ? selectedCategories.filter(c => c !== cat)
                              : [...selectedCategories, cat]);
                            setSortSelectedOnOpen(false);
                          }}
                        >
                          <span>{cat}</span>
                          {selectedCategories.includes(cat) && <span className="ml-2 text-[#9a0e20]">✓</span>}
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="font-semibold text-gray-700 text-sm mb-1 mt-2">Locations</div>
                  <div className="max-h-80 overflow-y-auto">
                    {(() => {
                      const filtered = locations
                        .filter(loc => loc && loc.nameEn)
                        .filter(loc => loc.nameEn.toLowerCase().includes(filterSearch.toLowerCase()));
                      let ordered;
                      if (sortSelectedOnOpen) {
                        const selected = filtered.filter(loc => selectedLocations.includes(loc.nameEn));
                        const unselected = filtered.filter(loc => !selectedLocations.includes(loc.nameEn));
                        ordered = [...selected, ...unselected];
                      } else {
                        ordered = filtered;
                      }
                      return ordered.map((loc, index) => (
                        <div
                          key={`location-${loc.id || loc.nameEn || index}`}
                          className={`px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-gray-800 flex items-center justify-between ${selectedLocations.includes(loc.nameEn) ? 'font-semibold text-[#9a0e20]' : ''}`}
                          onClick={() => {
                            setSelectedLocations(selectedLocations.includes(loc.nameEn)
                              ? selectedLocations.filter(l => l !== loc.nameEn)
                              : [...selectedLocations, loc.nameEn]);
                            setSortSelectedOnOpen(false);
                          }}
                        >
                          <span>{loc.nameEn}</span>
                          {selectedLocations.includes(loc.nameEn) && <span className="ml-2 text-[#9a0e20]">✓</span>}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Sağ: Grid ve Yeni İlan */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('quad')}
            className={`p-2 rounded-lg ${viewMode === 'quad' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
            title="Quad View"
          >
            <span className="sr-only">Quad View</span>
            <QuadGridIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => setViewMode('double')}
            className={`p-2 rounded-lg ${viewMode === 'double' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
            title="Dual View"
          >
            <span className="sr-only">Dual View</span>
            <MdOutlineGridView className="h-6 w-6" />
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`p-2 rounded-lg ${viewMode === 'single' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
            title="Single View"
          >
            <span className="sr-only">Single View</span>
            <MdOutlineViewAgenda className="h-6 w-6" />
          </button>
          <div className="relative">
            <button
              className="flex items-center px-4 h-[42px] bg-white border border-gray-200 rounded-xl shadow-sm text-gray-800 font-medium hover:border-[#801d21] focus:border-[#801d21] transition-colors cursor-pointer whitespace-nowrap"
              onClick={() => {
                setSortPopoverOpen(!sortPopoverOpen);
              }}
            >
              <FaSort className={`mr-2 text-lg ${((dateStart && dateStart.trim()) || (dateEnd && dateEnd.trim())) ? 'text-[#9a0e20]' : ''}`} />
              {sortOrder === 'desc' ? 'Newest to oldest' : 'Oldest to newest'}
            </button>
            {sortPopoverOpen && (
              <div ref={sortRef} className="absolute right-0 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <button
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${sortOrder === 'desc' ? 'font-bold text-[#9a0e20]' : 'text-gray-700 cursor-pointer'}`}
                    onMouseDown={() => {
                      setSortOrder('desc');
                      setSortPopoverOpen(false);
                    }}
                  >
                    {sortOrder === 'desc' ? <span>✓</span> : <span className="inline-block w-4" />} Newest to oldest
                  </button>
                  <button
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${sortOrder === 'asc' ? 'font-bold text-[#9a0e20]' : 'text-gray-700 cursor-pointer'}`}
                    onMouseDown={() => {
                      setSortOrder('asc');
                      setSortPopoverOpen(false);
                    }}
                  >
                    {sortOrder === 'asc' ? <span>✓</span> : <span className="inline-block w-4" />} Oldest to newest
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onNewPost}
            className="bg-[#9a0e20] text-white px-4 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors flex items-center space-x-2 text-sm font-medium cursor-pointer"
          >
            <MdOutlineAdd className="h-6 w-6" />
            <span>Create New Post</span>
          </button>
        </div>
      </div>
      {/* Mobil görünüm */}
      <div className="flex flex-col gap-4 p-3 md:hidden">
        {/* 1. Satır: All/Lost/Found ve New Post */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-gray-50 rounded-lg">
            <button
              onClick={() => setPostType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${postType === 'all' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
            >All</button>
            <button
              onClick={() => setPostType('lost')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${postType === 'lost' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
            >Lost</button>
            <button
              onClick={() => setPostType('found')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${postType === 'found' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
            >Found</button>
          </div>
          <button
            onClick={onNewPost}
            className="bg-[#9a0e20] text-white px-4 py-2 rounded-lg hover:bg-[#7a0b19] transition-colors flex items-center space-x-2 text-sm font-medium cursor-pointer"
          >
            <MdOutlineAdd className="h-6 w-6" />
            <span>New Post</span>
          </button>
        </div>
        {/* 2. Satır: Search, Tarih filtresi, Normal filtre */}
        <div className="flex items-center gap-2">
          <div className="flex items-center flex-1 bg-gray-100 rounded-xl border border-white/70 px-4 min-h-[38px] h-[42px] focus-within:border-[#801d21] transition-colors relative">
            <FiSearch className="text-2xl text-gray-600 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for lost items..."
              className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 text-base"
            />
          </div>
          <div className="relative flex items-center">
            <FiCalendar
              className={`text-2xl cursor-pointer hover:text-gray-800 transition-colors ${((dateStart && dateStart.trim()) || (dateEnd && dateEnd.trim())) ? 'text-[#9a0e20]' : 'text-gray-600'}`}
              onClick={() => setDatePopoverOpen(!datePopoverOpen)}
            />
            {datePopoverOpen && (
              <div ref={calendarRef} className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">Date Range</div>
                  {((dateStart && dateStart.trim()) || (dateEnd && dateEnd.trim())) && (
                    <button
                      onClick={() => { setDateStart(''); setDateEnd(''); }}
                      className="text-sm text-[#9a0e20] hover:text-[#801d21] font-medium cursor-pointer"
                    >Clear all</button>
                  )}
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start</label>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={e => setDateStart(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20]"
                      placeholder="gg.aa.yyyy"
                      max={dateEnd && dateEnd < today ? dateEnd : today}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={e => setDateEnd(e.target.value)}
                      className="w-full border rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-[#9a0e20] focus:border-[#9a0e20]"
                      placeholder="gg.aa.yyyy"
                      min={dateStart || undefined}
                      max={today}
                    />
                  </div>
                </div>
                <button
                  className="w-full bg-[#9a0e20] text-white rounded-lg py-2 font-semibold hover:bg-[#801d21] transition-colors cursor-pointer"
                  onClick={() => setDatePopoverOpen(false)}
                >Apply</button>
              </div>
            )}
          </div>
          <div className="relative flex items-center">
            <FiFilter
              className={`text-2xl cursor-pointer hover:text-gray-800 transition-colors ${(selectedCategories.length > 0 || selectedLocations.length > 0) && !filterPopoverOpen ? 'text-[#761a1e]' : 'text-gray-600'}`}
              onClick={() => {
                const next = !filterPopoverOpen;
                setFilterPopoverOpen(next);
                if (next) {
                  setFilterSearch("");
                  setSortSelectedOnOpen(true);
                }
              }}
            />
            {filterPopoverOpen && (
              <div ref={calendarRef} className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-gray-900">Filters</div>
                  {(selectedCategories.length > 0 || selectedLocations.length > 0) && (
                    <button
                      onClick={() => {
                        setSelectedCategories([]);
                        setSelectedLocations([]);
                      }}
                      className="text-sm text-[#9a0e20] hover:text-[#801d21] font-medium"
                    >Clear all</button>
                  )}
                </div>
                <div className="flex items-center mb-3 bg-gray-100 rounded px-2 py-1">
                  <FiSearch className="text-gray-500 mr-2 text-sm" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-sm flex-1 text-gray-800 placeholder-gray-400"
                  />
                </div>
                <div className="mb-2">
                  <div className="font-semibold text-gray-700 text-sm mb-1">Categories</div>
                  <div className="max-h-80 overflow-y-auto border-b pb-2 mb-2">
                    {(() => {
                      const filtered = categories.filter(cat => cat.toLowerCase().includes(filterSearch.toLowerCase()));
                      let ordered;
                      if (sortSelectedOnOpen) {
                        const selected = filtered.filter(cat => selectedCategories.includes(cat));
                        const unselected = filtered.filter(cat => !selectedCategories.includes(cat));
                        ordered = [...selected, ...unselected];
                      } else {
                        ordered = filtered;
                      }
                      return ordered.map((cat, index) => (
                        <div
                          key={`category-${cat || index}`}
                          className={`px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-gray-800 flex items-center justify-between ${selectedCategories.includes(cat) ? 'font-semibold text-[#9a0e20]' : ''}`}
                          onClick={() => {
                            setSelectedCategories(selectedCategories.includes(cat)
                              ? selectedCategories.filter(c => c !== cat)
                              : [...selectedCategories, cat]);
                            setSortSelectedOnOpen(false);
                          }}
                        >
                          <span>{cat}</span>
                          {selectedCategories.includes(cat) && <span className="ml-2 text-[#9a0e20]">✓</span>}
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="font-semibold text-gray-700 text-sm mb-1 mt-2">Locations</div>
                  <div className="max-h-80 overflow-y-auto">
                    {(() => {
                      const filtered = locations
                        .filter(loc => loc && loc.nameEn)
                        .filter(loc => loc.nameEn.toLowerCase().includes(filterSearch.toLowerCase()));
                      let ordered;
                      if (sortSelectedOnOpen) {
                        const selected = filtered.filter(loc => selectedLocations.includes(loc.nameEn));
                        const unselected = filtered.filter(loc => !selectedLocations.includes(loc.nameEn));
                        ordered = [...selected, ...unselected];
                      } else {
                        ordered = filtered;
                      }
                      return ordered.map((loc, index) => (
                        <div
                          key={`location-${loc.id || loc.nameEn || index}`}
                          className={`px-2 py-1 cursor-pointer hover:bg-gray-100 rounded text-gray-800 flex items-center justify-between ${selectedLocations.includes(loc.nameEn) ? 'font-semibold text-[#9a0e20]' : ''}`}
                          onClick={() => {
                            setSelectedLocations(selectedLocations.includes(loc.nameEn)
                              ? selectedLocations.filter(l => l !== loc.nameEn)
                              : [...selectedLocations, loc.nameEn]);
                            setSortSelectedOnOpen(false);
                          }}
                        >
                          <span>{loc.nameEn}</span>
                          {selectedLocations.includes(loc.nameEn) && <span className="ml-2 text-[#9a0e20]">✓</span>}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 3. Satır: 2li grid, 1li grid, sağda sıralama */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('double')}
              className={`p-2 rounded-lg ${viewMode === 'double' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
              title="Dual View"
            >
              <span className="sr-only">Dual View</span>
              <MdOutlineGridView className="h-6 w-6" />
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`p-2 rounded-lg ${viewMode === 'single' ? 'bg-[#9a0e20] text-white' : 'text-gray-700 hover:bg-gray-200 cursor-pointer'}`}
              title="Single View"
            >
              <span className="sr-only">Single View</span>
              <MdOutlineViewAgenda className="h-6 w-6" />
            </button>
          </div>
          <div className="relative">
            <button
              className="flex items-center px-4 h-[42px] bg-white border border-gray-200 rounded-xl shadow-sm text-gray-800 font-medium hover:border-[#801d21] focus:border-[#801d21] transition-colors cursor-pointer whitespace-nowrap"
              onClick={() => {
                setSortPopoverOpen(!sortPopoverOpen);
              }}
            >
              <FaSort className={`mr-2 text-lg ${((dateStart && dateStart.trim()) || (dateEnd && dateEnd.trim())) ? 'text-[#9a0e20]' : ''}`} />
              {sortOrder === 'desc' ? 'Newest to oldest' : 'Oldest to newest'}
            </button>
            {sortPopoverOpen && (
              <div ref={sortRef} className="absolute right-0 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <button
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${sortOrder === 'desc' ? 'font-bold text-[#9a0e20]' : 'text-gray-700 cursor-pointer'}`}
                    onMouseDown={() => {
                      setSortOrder('desc');
                      setSortPopoverOpen(false);
                    }}
                  >
                    {sortOrder === 'desc' ? <span>✓</span> : <span className="inline-block w-4" />} Newest to oldest
                  </button>
                  <button
                    className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 ${sortOrder === 'asc' ? 'font-bold text-[#9a0e20]' : 'text-gray-700 cursor-pointer'}`}
                    onMouseDown={() => {
                      setSortOrder('asc');
                      setSortPopoverOpen(false);
                    }}
                  >
                    {sortOrder === 'asc' ? <span>✓</span> : <span className="inline-block w-4" />} Oldest to newest
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchIsland; 