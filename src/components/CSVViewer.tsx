import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Eye, EyeOff } from 'lucide-react';
import { CSVRow } from '../store';
import { toCSV } from '../csvParser';

interface CSVViewerProps {
  headers: string[];
  rows: CSVRow[];
  title?: string;
  maxRows?: number;
  onExport?: () => void;
}

export default function CSVViewer({ headers, rows, title = 'Data Preview', maxRows, onExport }: CSVViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showRaw, setShowRaw] = useState(false);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchQuery) return rows;
    const query = searchQuery.toLowerCase();
    return rows.filter(row =>
      headers.some(h => (row[h] || '').toLowerCase().includes(query))
    );
  }, [rows, headers, searchQuery]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortColumn] || '';
      const bVal = b[sortColumn] || '';
      // Try numeric sort first
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      // String sort
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Paginate
  const displayRows = useMemo(() => {
    const limited = maxRows ? sortedRows.slice(0, maxRows) : sortedRows;
    const start = (currentPage - 1) * rowsPerPage;
    return limited.slice(start, start + rowsPerPage);
  }, [sortedRows, currentPage, rowsPerPage, maxRows]);

  const totalRows = maxRows ? Math.min(sortedRows.length, maxRows) : sortedRows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const csvContent = toCSV(headers, sortedRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Detect column type for styling
  const getColumnType = (header: string): 'numeric' | 'date' | 'text' => {
    const sample = rows.slice(0, 5).map(r => r[header] || '');
    if (sample.every(v => !isNaN(parseFloat(v)) && v !== '')) return 'numeric';
    if (sample.every(v => /^\d{4}-\d{2}-\d{2}/.test(v))) return 'date';
    return 'text';
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-[#2a2a3a]/50 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-xs font-semibold text-[#f0f0f5]">{title}</h3>
          <span className="text-[10px] text-[#555570] bg-[#12121a] px-2 py-0.5 rounded-full">
            {totalRows} rows × {headers.length} cols
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555570]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search..."
              className="w-full sm:w-40 bg-[#12121a] border border-[#2a2a3a] rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-[#f0f0f5] placeholder-[#555570] focus:outline-none focus:border-[#448aff]/50"
            />
          </div>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="p-1.5 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-[#8888a0] hover:text-white transition-colors"
            title={showRaw ? 'Show Table' : 'Show Raw CSV'}
          >
            {showRaw ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button
            onClick={onExport || handleExportCSV}
            className="p-1.5 rounded-lg bg-[#12121a] border border-[#2a2a3a] text-[#8888a0] hover:text-[#00e676] transition-colors"
            title="Export CSV"
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {showRaw ? (
        /* Raw CSV View */
        <div className="p-3 max-h-80 overflow-auto">
          <pre className="text-[10px] text-[#8888a0] font-mono whitespace-pre-wrap leading-relaxed">
            {toCSV(headers, displayRows)}
          </pre>
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-[#12121a] z-10">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] text-[#555570] font-medium border-b border-[#2a2a3a]/50 w-10">
                  #
                </th>
                {headers.map((header) => {
                  const colType = getColumnType(header);
                  const isSorted = sortColumn === header;
                  return (
                    <th
                      key={header}
                      onClick={() => handleSort(header)}
                      className={`px-3 py-2 font-medium border-b border-[#2a2a3a]/50 cursor-pointer hover:bg-[#22222f] transition-colors whitespace-nowrap ${
                        colType === 'numeric' ? 'text-right' : 'text-left'
                      } ${isSorted ? 'text-[#448aff]' : 'text-[#8888a0]'}`}
                    >
                      <div className="flex items-center gap-1 justify-end">
                        <span>{header.replace(/_/g, ' ')}</span>
                        <ArrowUpDown size={10} className={isSorted ? 'text-[#448aff]' : 'text-[#555570]'} />
                        {isSorted && (
                          <span className="text-[9px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => {
                const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                return (
                  <tr
                    key={idx}
                    className="border-b border-[#2a2a3a]/20 hover:bg-[#22222f]/50 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-[#555570] text-[10px]">{rowNum}</td>
                    {headers.map((header) => {
                      const colType = getColumnType(header);
                      const value = row[header] || '';
                      return (
                        <td
                          key={header}
                          className={`px-3 py-1.5 whitespace-nowrap ${
                            colType === 'numeric' ? 'text-right font-mono' : 'text-left'
                          } ${
                            colType === 'date' ? 'text-[#b388ff]' :
                            colType === 'numeric' ? 'text-[#00e5ff]' :
                            'text-[#f0f0f5]'
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-2 border-t border-[#2a2a3a]/50 flex items-center justify-between">
          <span className="text-[10px] text-[#555570]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded bg-[#12121a] border border-[#2a2a3a] text-[#8888a0] disabled:opacity-30 hover:text-white transition-all"
            >
              <ChevronLeft size={12} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6 h-6 rounded text-[10px] font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-[#448aff]/20 text-[#448aff] border border-[#448aff]/30'
                      : 'text-[#8888a0] hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded bg-[#12121a] border border-[#2a2a3a] text-[#8888a0] disabled:opacity-30 hover:text-white transition-all"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
