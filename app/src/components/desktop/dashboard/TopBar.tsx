import { HardDrive, LayoutGrid, List, Sun, Moon, Settings, Share2, X, Search, ChevronRight, Globe } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

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
    onRemoteUploadClick: () => void;
}

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
    onDownloadFolder, onClearSelection, viewMode, setViewMode, searchTerm, onSearchChange, onSettingsClick,
    onRemoteUploadClick
}: TopBarProps) {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <header
            className="h-14 border-b border-telegram-border/70 flex items-center px-3 sm:px-4 gap-3 bg-telegram-surface/70 backdrop-blur-xl sticky top-0 z-10"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center gap-1.5 text-sm select-none flex-shrink-0">
                <span className="text-telegram-subtext hover:text-telegram-text cursor-pointer transition-colors">{t('common.start')}</span>
                <ChevronRight className="w-3.5 h-3.5 text-telegram-subtext/60" />
                <span className="text-telegram-text font-medium max-w-[180px] truncate">{currentFolderName}</span>
            </div>

            <div className="flex-1 flex justify-center min-w-0">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-telegram-subtext pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('common.search_placeholder')}
                        className="w-full bg-telegram-hover/70 border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-sm text-telegram-text placeholder:text-telegram-subtext focus:outline-none focus:border-telegram-primary/40 focus:bg-telegram-bg/60 transition-colors"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 mr-2 pr-2 border-r border-telegram-border animate-in fade-in slide-in-from-top-2">
                        <span className="text-xs text-telegram-subtext">{t('files.items_selected', { count: selectedIds.length })}</span>
                        <button onClick={onClearSelection} className="p-1.5 hover:bg-telegram-hover rounded-md text-telegram-subtext hover:text-telegram-text transition" title={t('files.clear_selection')}><X className="w-3.5 h-3.5" /></button>
                        <button onClick={onShowMoveModal} className="px-3 py-1.5 bg-telegram-primary/15 hover:bg-telegram-primary/25 text-telegram-primary rounded-md text-xs transition font-medium">{t('files.move_to')}</button>
                        <button onClick={onBulkDownload} className="px-3 py-1.5 bg-telegram-hover hover:bg-telegram-border rounded-md text-xs text-telegram-text transition">{t('files.download_selected')}</button>
                        <button onClick={onBulkShare} className="px-3 py-1.5 bg-telegram-primary/15 hover:bg-telegram-primary/25 text-telegram-primary rounded-md text-xs transition font-medium flex items-center gap-1"><Share2 className="w-3 h-3" />{t('files.share')} ({selectedIds.length})</button>
                        <button onClick={onBulkDelete} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs transition">{t('files.delete')}</button>
                    </div>
                )}

                <button onClick={onDownloadFolder} className={iconBtn} title={t('files.download_folder')}>
                    <HardDrive className="w-5 h-5" />
                    <Tip>{t('files.download_all')}</Tip>
                </button>

                <button onClick={onRemoteUploadClick} className={iconBtn} title={t('files.remote_upload')}>
                    <Globe className="w-5 h-5" />
                    <Tip>{t('files.remote_upload_url')}</Tip>
                </button>

                <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className={iconBtn}
                    title={t('files.toggle_layout')}
                >
                    {viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                    <Tip>{viewMode === 'grid' ? t('files.switch_list') : t('files.switch_grid')}</Tip>
                </button>

                <div className="w-px h-5 bg-telegram-border mx-1" />

                <button onClick={onSettingsClick} className={iconBtn} title={t('common.settings')}>
                    <Settings className="w-5 h-5" />
                    <Tip>{t('common.settings')}</Tip>
                </button>

                <button
                    onClick={toggleTheme}
                    className={iconBtn}
                    title={theme === 'dark' ? t('common.switch_light') : t('common.switch_dark')}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <Tip>{theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}</Tip>
                </button>
            </div>
        </header>
    )
}
