import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatPanel from './ChatPanel';
import { Location, Transport, Day } from '../../types';
import { SearchViewbox } from '../../services/geocoding';

interface SidebarProps {
  selectedLocationId?: string | null;
  onLocationClick?: (locationId: string) => void;
  onLocationEdit?: (location: Location) => void;
  onLocationDelete?: (locationId: string) => void;
  onTransportAdd?: (fromLocationId: string, toLocationId: string) => void;
  onTransportEdit?: (transport: Transport) => void;
  onTransportDelete?: (transportId: string) => void;
  onLocationMove?: (locationId: string, sourceDayId: string, targetDayId: string, newOrder: number) => Promise<void>;
  allDays?: Day[];
  locationRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

interface HeaderProps {
  onLocationSelect?: (result: any) => void;
  onAddLocationFromSearch?: (result: any) => void;
  onPlanEdit?: () => void;
  onChatToggle?: () => void;
  isChatOpen?: boolean;
  mapBounds?: SearchViewbox; // For location-biased search
}

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showSidebar?: boolean;
  showChatPanel?: boolean;
  headerProps?: HeaderProps;
  sidebarProps?: SidebarProps;
  chatPanelCollapsed?: boolean;
  isChatOpen?: boolean;
}

export function AppLayout({ 
  children, 
  showHeader = true, 
  showSidebar = true, 
  showChatPanel = false,
  headerProps, 
  sidebarProps,
  chatPanelCollapsed = false,
  isChatOpen = false,
}: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {showHeader && <Header {...headerProps} />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showSidebar && <Sidebar {...sidebarProps} />}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#f4f4f4',
          }}
        >
          {children}
        </main>
        {showChatPanel && isChatOpen && <ChatPanel isCollapsed={chatPanelCollapsed} />}
      </div>
    </div>
  );
}

export default AppLayout;


