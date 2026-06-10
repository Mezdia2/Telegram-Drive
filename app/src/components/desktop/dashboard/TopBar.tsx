import { HardDrive, LayoutGrid, List, Sun, Moon, Settings, Share2, X, Search, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { ProxyControl } from './ProxyControl';

interface TopBarProps {
    currentFolderName: string;
    selectedIds: number[];
    onShowMoveModal: () => void;
    onBulkDownload: () => void;
    onBulkDelete: () => void;
    onBulkShare: () => void;
    onDownloadFolder: () => void;
    onClearSelection: () => void;
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onSettingsClick: () => void;
    onProxySettings: () => void;
}

// Shared icon-button styling for a clean, consistent title bar
const iconBtn = "group relative flex items-center justify-center w-9 h-9 rounded-lg text-telegram-subtext hover:text-telegram-text hover:bg-telegram-hover transition-colors";

function Tip({ children }: { children: React.ReactNode }) {
    return (
        <span className="pointer-events-none absolute top-full mt-1.5 left-1/2 -translate-x-1/2 text-[10px] bg-telegram-elevated border border-telegram-border px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg text-telegram-text">
            {children}
        </span>
    );
}

export function TopBar({
    currentFolderName, selectedIds, onShowMoveModal, onBulkDownload, onBulkDelete, onBulkShare,
    onDownloadFolder, onClearSelection, viewMode, setViewMode, searchTerm, onSearchChange, onSettingsClick, onProxySettings
}: TopBarProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <header
            className="h-14 border-b border-telegram-border/70 flex items-center px-3 sm:px-4 gap-3 bg-telegram-surface/70 backdrop-blur-xl sticky top-0 z-10"
            onClick={e => e.stopPropagation()}
        >
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm select-none flex-shrink-0">
                <span className="text-telegram-subtext hover:text-telegram-text cursor-pointer transition-colors">Start</span>
                <ChevronRight className="w-3.5 h-3.5 text-telegram-subtext/60" />
                <span className="text-telegram-text font-medium max-w-[180px] truncate">{currentFolderName}</span>
            </div>

            {/* Search */}
            <div className="flex-1 flex justify-center min-w-0">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-telegram-subtext pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        className="w-full bg-telegram-hover/70 border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-sm text-telegram-text placeholder:text-telegram-subtext focus:outline-none focus:border-telegram-primary/40 focus:bg-telegram-bg/60 transition-colors"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2 pr-2 border-r border-telegram-border animate-in fade-in slide-in-from-top-2">
                        <span className="text-xs text-telegram-subtext">{selectedIds.length} selected</span>
                        <button onClick={onClearSelection} className="p-1.5 hover:bg-telegram-hover rounded-md text-telegram-subtext hover:text-telegram-text transition" title="Clear selection (Esc)"><X className="w-3.5 h-3.5" /></button>
                        <button onClick={onShowMoveModal} className="px-3 py-1.5 bg-telegram-primary/15 hover:bg-telegram-primary/25 text-telegram-primary rounded-md text-xs transition font-medium">Move to…</button>
                        <button onClick={onBulkDownload} className="px-3 py-1.5 bg-telegram-hover hover:bg-telegram-border rounded-md text-xs text-telegram-text transition">Download</button>
                        <button onClick={onBulkShare} className="px-3 py-1.5 bg-telegram-primary/15 hover:bg-telegram-primary/25 text-telegram-primary rounded-md text-xs transition font-medium flex items-center gap-1"><Share2 className="w-3 h-3" />Share ({selectedIds.length})</button>
                        <button onClick={onBulkDelete} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs transition">Delete</button>
                    </div>
                )}

                <button onClick={onDownloadFolder} className={iconBtn} title="Download all files">
                    <HardDrive className="w-5 h-5" />
                    <Tip>Download All Files</Tip>
                </button>

                <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className={iconBtn}
                    title="Toggle layout"
                >
                    {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    <Tip>{viewMode === 'grid' ? 'Switch to List' : 'Switch to Grid'}</Tip>
                </button>

                <div className="w-px h-5 bg-telegram-border mx-1" />

                {/* Proxy quick-control */}
                <ProxyControl onOpenSettings={onProxySettings} />

                <button onClick={onSettingsClick} className={iconBtn} title="Settings">
                    <Settings className="w-5 h-5" />
                    <Tip>Settings</Tip>
                </button>

                <button
                    onClick={toggleTheme}
                    className={iconBtn}
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <Tip>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</Tip>
                </button>
            </div>
        </header>
    )
}
