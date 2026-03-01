'use client';

import { useRouter } from 'next/navigation';

export default function SortOptions({ currentSort, isMobile = false }: { currentSort: string, isMobile?: boolean }) {
  const router = useRouter();

  const handleSortChange = (sort: string) => {
    router.push(`/?sort=${sort}`);
  };

  const options = [
    { id: 'new', label: 'Newest', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'top_day', label: 'Top (Day)', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'top_week', label: 'Top (Week)', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'top_month', label: 'Top (Month)', icon: 'M13 10V3L4 14h7v7l9-11h-7z' }
  ];

  if (isMobile) {
    return (
      <div className="flex justify-between items-center mb-4 bg-[#1a1a1b] p-2 px-4 rounded border border-gray-800 md:hidden">
        <span className="text-xs font-bold text-[#818384] uppercase tracking-wider">Sort By</span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="appearance-none bg-[#272729] text-[#d7dadc] text-xs font-bold py-1.5 pl-3 pr-8 rounded-md border border-gray-700 hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff4500] cursor-pointer transition-colors"
          >
            {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#818384]">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1b] rounded border border-gray-800 p-4 flex flex-col w-full">
      <div className="flex flex-col gap-3">
        <span className="text-[10px] font-bold text-[#818384] uppercase tracking-widest px-1">Sort Feed</span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="appearance-none w-full bg-[#272729] text-[#d7dadc] text-sm font-semibold py-2 pl-3 pr-10 rounded-md border border-gray-700 hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ff4500] cursor-pointer transition-colors"
          >
            {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#818384]">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
