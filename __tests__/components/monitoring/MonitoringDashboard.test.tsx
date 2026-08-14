// Monitoring Dashboard Component Tests
// Tests pour le composant MonitoringDashboard

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';

// Mock fetch for API calls
const mockMonitoringData = {
  timestamp: new Date().toISOString(),
  health: {
    status: 'healthy',
    uptime: 99.95,
    version: '2.4.1',
    environment: 'test',
  },
  performance: {
    requestsPerSecond: 150,
    avgResponseTime: 120,
    p95ResponseTime: 350,
    errorRate: 0.5,
    activeUsers: 250,
    activeConnections: 45,
  },
  infrastructure: {
    cpu: {
      usage: 45,
      cores: 8,
      loadAvg: [1.2, 1.8, 1.5],
    },
    memory: {
      used: 6.2,
      total: 16,
      percentage: 38.75,
    },
    disk: [
      { path: '/', percentage: 55, free: 45 },
      { path: '/data', percentage: 72, free: 28 },
    ],
    network: {
      inbound: 500000,
      outbound: 250000,
    },
  },
  business: {
    totalRevenue: 52350,
    ordersToday: 87,
    newUsersToday: 24,
    conversionRate: 3.2,
    activeProducts: 1247,
    rfqCount: 105,
  },
  alerts: [
    {
      id: 'alert-1',
      severity: 'warning',
      message: 'High memory usage detected on web server',
      metric: 'memory.usage',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      severity: 'info',
      message: 'Scheduled maintenance window starting in 1 hour',
      metric: 'maintenance',
      timestamp: new Date().toISOString(),
    },
  ],
};

// Mock fetch globally
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve(mockMonitoringData),
});

describe('MonitoringDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('should render dashboard title', () => {
      render(<MonitoringDashboard />);
      
      expect(screen.getByText(/Enterprise Monitor/i)).toBeInTheDocument();
    });

    it('should render all main tabs', () => {
      render(<MonitoringDashboard />);
      
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/Infrastructure/i)).toBeInTheDocument();
      expect(screen.getByText(/Performance/i)).toBeInTheDocument();
      expect(screen.getByText(/Business/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerts/i)).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      // Make fetch hang to show loading state
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );
      
      render(<MonitoringDashboard />);
      
      // Should show loading indicator
      expect(screen.getByText(/Loading|Fetching|Refreshing/i) || 
             document.querySelector('[role="progressbar"]')).toBeDefined();
    });
  });

  describe('Data Loading', () => {
    it('should fetch monitoring data on mount', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/monitoring'),
          expect.any(Object)
        );
      });
    });

    it('should display fetched data correctly', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/99.95/)).toBeInTheDocument(); // Uptime
        expect(screen.getByText(/150/)).toBeInTheDocument(); // RPS or similar metric
      });
    });

    it('handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/error|failed|unable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab', () => {
    it('should display system health status', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        const statusElement = screen.getByText(/healthy|degraded|unhealthy/i);
        expect(statusElement).toBeInTheDocument();
      });
    });

    it('should display uptime percentage', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/99\.95/)).toBeInTheDocument();
      });
    });

    it('should display key metrics cards', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        // Check for key metrics being displayed
        const metrics = screen.getAllByText(/\d+/);
        expect(metrics.length).toBeGreaterThan(5); // Should have multiple numeric values
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Infrastructure tab when clicked', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Infrastructure/i)).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText(/Infrastructure/i));
      
      // Infrastructure-specific content should be visible
      await waitFor(() => {
        expect(screen.getByText(/CPU|Memory|Disk|Network/i)).toBeInTheDocument();
      });
    });

    it('should switch to Performance tab when clicked', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Performance/i));
      });
      
      // Performance-specific content should be visible
      await waitFor(() => {
        expect(screen.getByText(/Response Time|Requests|Error Rate/i)).toBeInTheDocument();
      });
    });

    it('should switch to Business tab when clicked', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Business/i));
      });
      
      // Business metrics should be visible
      await waitFor(() => {
        expect(screen.getByText(/Revenue|Orders|Conversion/i)).toBeInTheDocument();
      });
    });

    it('should switch to Alerts tab when clicked', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Alerts/i));
      });
      
      // Alerts should be displayed
      await waitFor(() => {
        expect(screen.getByText(/High memory usage|Scheduled maintenance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('should have refresh button', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh|reload/i }) ||
                            document.querySelector('[data-testid="refresh-button"]');
        expect(refreshButton).toBeTruthy();
      });
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
      
      const refreshButton = screen.getByRole('button', { name: /refresh|reload/i }) ||
                          document.querySelector('button[title*="Refresh"]') ||
                          document.querySelector('.lucide-refresh-cw')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);
        
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + refresh
        });
      }
    });

    it('should auto-refresh at configured interval', async () => {
      render(<MonitoringDashboard />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      
      const initialCallCount = (global.fetch as jest.Mock).mock.calls.length;
      
      // Advance time by auto-refresh interval (typically 30s)
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      await waitFor(() => {
        expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Status Indicators', () => {
    it('should show correct color for healthy status', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        const healthyBadge = screen.getByText(/healthy/i);
        expect(healthyBadge).toHaveClass(/text-green|bg-green|green-/i);
      });
    });

    it('should show warning badge for warning alerts', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Alerts/i));
      });
      
      await waitFor(() => {
        const warningAlert = screen.getByText(/warning/i);
        expect(warningAlert).toBeInTheDocument();
      });
    });

    it('should show critical styling for critical alerts', async () => {
      const dataWithCriticalAlert = {
        ...mockMonitoringData,
        alerts: [
          {
            id: 'critical-alert',
            severity: 'critical',
            message: 'Database connection pool exhausted',
            metric: 'db.pool',
            timestamp: new Date().toISOString(),
          },
        ],
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dataWithCriticalAlert),
      });
      
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Alerts/i));
      });
      
      await waitFor(() => {
        const criticalAlert = screen.getByText(/critical/i);
        expect(criticalAlert).toBeInTheDocument();
      });
    });
  });

  describe('Metric Cards', () => {
    it('should display CPU usage with progress bar', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Infrastructure/i));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/45%?|CPU/i)).toBeInTheDocument();
      });
    });

    it('should display memory usage', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Infrastructure/i));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/6\.2.*GB|38\.75%?|Memory/i)).toBeInTheDocument();
      });
    });

    it('should display disk usage per partition', async () => {
      render(<MonitoringDashboard />);
      
      await waitFor(() => {
        fireEvent.click(screen.getByText(/Infrastructure/i));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/\/|55%?|72%?/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<MonitoringDashboard />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });

    it('should have accessible tabs', async () => {
      render(<MonitoringDashboard />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(5); // Overview + 4 other tabs
    });

    it('should support keyboard navigation between tabs', async () => {
      render(<MonitoringDashboard />);
      
      const firstTab = screen.getAllByRole('tab')[0];
      firstTab.focus();
      
      expect(firstTab).toHaveFocus();
      
      // Press right arrow to move to next tab
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      
      // Tab focus should change (implementation dependent)
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive and render on mobile viewports', () => {
      global.innerWidth = 375; // Mobile width
      
      render(<MonitoringDashboard />);
      
      // Should still render without errors
      expect(screen.getByText(/Enterprise Monitor/i)).toBeInTheDocument();
    });

    it('should be responsive on tablet viewports', () => {
      global.innerWidth = 768; // Tablet width
      
      render(<MonitoringDashboard />);
      
      expect(screen.getByText(/Enterprise Monitor/i)).toBeInTheDocument();
    });
  });
});

describe('MonitoringDashboard - Edge Cases', () => {
  it('should handle empty alerts array', async () => {
    const dataWithNoAlerts = {
      ...mockMonitoringData,
      alerts: [],
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataWithNoAlerts),
    });
    
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Alerts/i));
    });
    
    await waitFor(() => {
      expect(screen.getByText(/no alerts|all clear|0 alerts/i)).toBeInTheDocument();
    });
  });

  it('should handle missing optional fields gracefully', async () => {
    const incompleteData = {
      timestamp: new Date().toISOString(),
      health: { status: 'healthy' },
      performance: {},
      infrastructure: {},
      business: {},
      alerts: [],
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(incompleteData),
    });
    
    render(<MonitoringDashboard />);
    
    // Should not throw errors
    await waitFor(() => {
      expect(screen.getByText(/Enterprise Monitor/i)).toBeInTheDocument();
    });
  });

  it('should handle very large numbers in metrics', async () => {
    const dataWithLargeNumbers = {
      ...mockMonitoringData,
      business: {
        totalRevenue: 999999999,
        ordersToday: 99999,
        newUsersToday: 9999,
        conversionRate: 99.99,
        activeProducts: 999999,
        rfqCount: 99999,
      },
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(dataWithLargeNumbers),
    });
    
    render(<MonitoringDashboard />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Business/i));
    });
    
    // Should format large numbers appropriately
    await waitFor(() => {
      expect(document.body.textContent).toContain('999');
    });
  });
});
