import { useState } from 'react';
import { HardDrive, Folder, Plus, RefreshCw, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarItem } from './SidebarItem';
import { BandwidthWidget } from './BandwidthWidget';
import { TelegramFolder, BandwidthStats } from '../../../types';
import { useSettings } from '../../../context/SettingsContext';

interface SidebarProps {
    folders: TelegramFolder[];
    activeFolderId: number | null;
    setActiveFolderId: (id: number | null) => void;
    onDrop: (e: React.DragEvent, folderId: number | null) => void;
    onDelete: (id: number, name: string) => void;
    onRename: (id: number, name: string) => void;
    onToggleVisibility: (id: number, name: string, isPublic: boolean) => void;
    onExportInvite: (id: number, name: string) => void;
    onCreate: (name: string) => Promise<void>;
    isSyncing: boolean;
    isConnected: boolean;
    onSync: () => void;
    onLogout: () => void;
    bandwidth: BandwidthStats | null;
}

export function Sidebar({
    folders, activeFolderId, setActiveFolderId, onDrop, onDelete, onRename, onToggleVisibility, onExportInvite, onCreate,
    isSyncing, isConnected, onSync, onLogout, bandwidth
}: SidebarProps) {
    const { settings, updateSetting } = useSettings();
    const collapsed = settings.sidebarCollapsed;
    const setCollapsed = (v: boolean) => updateSetting('sidebarCollapsed', v);

    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const { t } = useTranslation();

    const submitCreate = async () => {
        if (!newFolderName.trim()) return;
        try {
            await onCreate(newFolderName);
            setNewFolderName("");
            setShowNewFolderInput(false);
        } catch {
            // handled by parent
        }
    }

    const startCreate = () => {
        if (collapsed) setCollapsed(false);
        setShowNewFolderInput(true);
    };

    return (
        <aside
            className={`relative flex flex-col bg-telegram-surface border-r border-telegram-border transition-[width] duration-200 ease-out ${collapsed ? 'w-[68px]' : 'w-64'}`}
            onClick={e => e.stopPropagation()}
        >
            <div className={`flex items-center h-14 border-b border-telegram-border/60 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
                {collapsed ? (
                    <button
                        onClick={() => setCollapsed(false)}
                        className="group relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-telegram-hover transition-colors"
                            title={t('common.expand_sidebar', 'Expand sidebar')}
                    >
                        <img src="/logo.svg" className="w-6 h-6 drop-shadow group-hover:hidden" alt="Logo" />
                        <PanelLeftOpen className="w-5 h-5 text-telegram-subtext hidden group-hover:block" />
                    </button>
                ) : (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <img src="/logo.svg" className="w-7 h-7 drop-shadow-lg flex-shrink-0" alt="Logo" />
                            <span className="font-display text-lg text-telegram-text truncate">{t('common.app_title')}</span>
                        </div>
                        <button
                            onClick={() => setCollapsed(true)}
                            className="flex-shrink-0 p-1.5 rounded-lg text-telegram-subtext hover:text-telegram-text hover:bg-telegram-hover transition-colors"
                            title={t('common.collapse_sidebar', 'Collapse sidebar')}
                        >
                            <PanelLeftClose className="w-[18px] h-[18px]" />
                        </button>
                    </>
                )}
            </div>

            <nav className={`flex-1 py-3 space-y-1 overflow-y-auto overflow-x-hidden min-h-0 ${collapsed ? 'px-2.5' : 'px-2'}`}>
                <SidebarItem
                    icon={HardDrive}
                    label={t('common.saved_messages')}
                    active={activeFolderId === null}
                    onClick={() => setActiveFolderId(null)}
                    onDrop={(e: React.DragEvent) => onDrop(e, null)}
                    folderId={null}
                    collapsed={collapsed}
                />
                {folders.map(folder => (
                    <SidebarItem
                        key={folder.id}
                        icon={Folder}
                        label={folder.name}
                        active={activeFolderId === folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        onDrop={(e: React.DragEvent) => onDrop(e, folder.id)}
                        onDelete={() => onDelete(folder.id, folder.name)}
                        onRename={() => onRename(folder.id, folder.name)}
                        onToggleVisibility={() => onToggleVisibility(folder.id, folder.name, !!(folder.is_public || folder.username))}
                        onExportInvite={() => onExportInvite(folder.id, folder.name)}
                        folderId={folder.id}
                        isPublic={!!(folder.is_public || folder.username)}
                        collapsed={collapsed}
                    />
                ))}
            </nav>

            <div className={`pb-2 border-b border-telegram-border/60 ${collapsed ? 'px-2.5' : 'px-2'}`}>
                {showNewFolderInput && !collapsed ? (
                    <div className="px-3 py-2">
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-telegram-primary"
                            placeholder={t('common.folder_name_placeholder')}
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitCreate()}
                            onBlur={() => !newFolderName && setShowNewFolderInput(false)}
                        />
                    </div>
                ) : (
                    <button
                        onClick={startCreate}
                        title={collapsed ? t('common.create_folder') : undefined}
                        className={`group relative w-full flex items-center rounded-xl text-sm font-medium text-telegram-subtext hover:bg-telegram-hover hover:text-telegram-text transition-colors border border-dashed border-telegram-border ${collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'}`}
                    >
                        <Plus className="w-[18px] h-[18px] flex-shrink-0" />
                        {!collapsed && t('common.create_folder')}
                        {collapsed && (
                            <span className="pointer-events-none absolute left-full ml-3 z-[120] whitespace-nowrap rounded-md bg-telegram-elevated border border-telegram-border px-2 py-1 text-xs text-telegram-text opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                                {t('common.create_folder')}
                            </span>
                        )}
                    </button>
                )}
            </div>

            <div className={`border-t border-telegram-border/60 ${collapsed ? 'px-2.5 py-3' : 'p-4'}`}>
                {collapsed ? (
                    <div className="flex flex-col items-center gap-1.5">
                        <div
                            className="flex items-center justify-center w-9 h-9"
                            title={isConnected ? t('common.connected_telegram') : t('common.disconnected_telegram')}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        </div>
                        <button
                            onClick={onSync}
                            disabled={isSyncing}
                            title={t('common.sync')}
                            className={`group relative flex items-center justify-center w-9 h-9 rounded-xl text-blue-400 hover:bg-blue-500/15 transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`w-[18px] h-[18px] ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onLogout}
                            title={t('common.logout')}
                            className="flex items-center justify-center w-9 h-9 rounded-xl text-red-400 hover:bg-red-500/15 transition-colors"
                        >
                            <LogOut className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 text-telegram-subtext text-xs">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span>{isConnected ? t('common.connected_telegram') : t('common.disconnected_telegram')}</span>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={onSync}
                                disabled={isSyncing}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={t('common.sync')}
                            >
                                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? t('common.syncing') : t('common.sync')}
                            </button>
                            <button
                                onClick={onLogout}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                title={t('common.logout')}
                            >
                                <LogOut className="w-3 h-3" />
                                {t('common.logout')}
                            </button>
                        </div>

                        {bandwidth && <BandwidthWidget bandwidth={bandwidth} />}
                    </>
                )}
            </div>
        </aside>
    )
}
