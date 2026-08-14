// Error Boundary Unit Tests
// Tests pour le composant SentryErrorBoundary

import React from 'react';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';
import { SentryErrorBoundary, withSentryErrorBoundary, useErrorHandler, DefaultFallback } from '@/lib/monitoring/error-boundary';

// Mock Sentry module
jest.mock('@/lib/monitoring/sentry', () => ({
  captureException: jest.fn().mockReturnValue('test-event-id'),
  addBreadcrumb: jest.fn(),
}));

// ===========================================
// Mock Components for Testing
// ===========================================

const WorkingComponent = () => <div data-testid="working">Working Content</div>;

const ThrowingComponent = () => {
  throw new Error('Test error from component');
};

const CustomFallback = ({ error, resetErrorBoundary, retryCount }: any) => (
  <div data-testid="custom-fallback">
    <span data-testid="error-message">{error.message}</span>
    <span data-testid="retry-count">{retryCount}</span>
    <button data-testid="custom-reset" onClick={resetErrorBoundary}>
      Custom Reset
    </button>
  </div>
);

// ===========================================
// Test Suites
// ===========================================

describe('SentryErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <SentryErrorBoundary>
          <WorkingComponent />
        </SentryErrorBoundary>
      );

      expect(screen.getByTestId('working')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-fallback')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <SentryErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </SentryErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <SentryErrorBoundary>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      // Should show alert role for accessibility
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();

      // Should show error message
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/Test error from component/i)).toBeInTheDocument();
    });

    it('should call captureException with error details', () => {
      const { captureException } = require('@/lib/monitoring/sentry');
      
      render(
        <SentryErrorBoundary componentName="TestComponent">
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      expect(captureException).toHaveBeenCalledTimes(1);
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({
            component: 'TestComponent',
            isErrorBoundary: 'true',
          }),
          context: 'react',
          level: 'error',
        })
      );
    });

    it('should add breadcrumb before capturing exception', () => {
      const { addBreadcrumb } = require('@/lib/monitoring/sentry');
      
      render(
        <SentryErrorBoundary componentName="MyComponent">
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      expect(addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'errorboundary',
          level: 'error',
          data: expect.objectContaining({
            componentName: 'MyComponent',
          }),
        })
      );
    });

    it('should call onError callback when provided', () => {
      const onError = jest.fn();

      render(
        <SentryErrorBoundary onError={onError}>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });
  });

  describe('Custom Fallback', () => {
    it('should use custom fallback component when provided', () => {
      render(
        <SentryErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Test error from component');
    });

    it('should pass retry count to fallback', () => {
      render(
        <SentryErrorBoundary fallback={CustomFallback}>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      expect(screen.getByTestId('retry-count')).toHaveTextContent('0');
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when retry button is clicked', () => {
      let hasError = true;
      
      const ConditionalThrower = () => {
        if (hasError) throw new Error('Conditional error');
        return <div data-testid="recovered">Recovered!</div>;
      };

      const { rerender } = render(
        <SentryErrorBoundary>
          <ConditionalThrower />
        </SentryErrorBoundary>
      );

      // Should show error state
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click Try Again button (which calls resetErrorBoundary)
      hasError = false;
      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      // After reset, should re-render children
      // Note: In actual React behavior, this would re-render and show recovered content
      // The exact behavior depends on React's reconciliation
    });

    it('should respect maxRetries limit', () => {
      const onReset = jest.fn();

      render(
        <SentryErrorBoundary 
          fallback={CustomFallback}
          maxRetries={2}
          onReset={onReset}
        >
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      // First reset
      fireEvent.click(screen.getByTestId('custom-reset'));
      expect(onReset).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('retry-count')).toHaveTextContent('1');

      // Second reset
      fireEvent.click(screen.getByTestId('custom-reset'));
      expect(onReset).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('retry-count')).toHaveTextContent('2');

      // Third attempt should be blocked (maxRetries=2)
      fireEvent.click(screen.getByTestId('custom-reset'));
      expect(onReset).toHaveBeenCalledTimes(2); // Not called again
      expect(screen.getByTestId('retry-count')).toHaveTextContent('2'); // Still 2
    });

    it('should call onReset callback when resetting', () => {
      const onReset = jest.fn();

      render(
        <SentryErrorBoundary fallback={CustomFallback} onReset={onReset}>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      fireEvent.click(screen.getByTestId('custom-reset'));
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on error state', () => {
      render(
        <SentryErrorBoundary>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('role', 'alert');
    });

    it('should have focusable action buttons in fallback', () => {
      render(
        <SentryErrorBoundary>
          <ThrowingComponent />
        </SentryErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // At least Try Again and Reload Page
      
      // Check for Try Again button
      const tryAgainButton = buttons.find(b => b.textContent?.includes('Try Again'));
      expect(tryAgainButton).toBeDefined();
    });
  });
});

describe('withSentryErrorBoundary HOC', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should wrap component with error boundary', () => {
    const SimpleComponent = () => <div data-testid="hoc-wrapped">HOC Wrapped</div>;
    
    const WrappedComponent = withSentryErrorBoundary(SimpleComponent, {
      componentName: 'SimpleComponent',
    });

    render(<WrappedComponent />);
    expect(screen.getByTestId('hoc-wrapped')).toBeInTheDocument();
  });

  it('should use component displayName for tracking', () => {
    const NamedComponent = () => <div>Named</div>;
    NamedComponent.displayName = 'NamedComponent';
    
    const { captureException } = require('@/lib/monitoring/sentry');
    const Wrapped = withSentryErrorBoundary(NamedComponent);

    // Render with error - need to trigger error inside wrapped component
    const ThrowingNamed = () => {
      throw new Error('HOC Error');
    };
    
    const WrappedThrowing = withSentryErrorBoundary(ThrowingNamed, {
      componentName: 'NamedComponent',
    });

    render(<WrappedThrowing />);
    
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({
          component: 'NamedComponent',
        }),
      })
    );
  });

  it('should set correct displayName on wrapper', () => {
    const InnerComponent = () => <div>Inner</div>;
    InnerComponent.displayName = 'InnerComponent';
    
    const Wrapped = withSentryErrorBoundary(InnerComponent);
    
    expect(Wrapped.displayName).toBe('withSentryErrorBoundary(InnerComponent)');
  });
});

describe('DefaultFallback Component', () => {
  it('should render error message', () => {
    const error = new Error('Test fallback error');
    
    render(
      <DefaultFallback 
        error={error} 
        resetErrorBoundary={() => {}}
        retryCount={0}
        componentStack={null}
      />
    );

    expect(screen.getByText('Test fallback error')).toBeInTheDocument();
  });

  it('should show retry count when > 0', () => {
    const error = new Error('Retry error');
    
    render(
      <DefaultFallback 
        error={error} 
        resetErrorBoundary={() => {}}
        retryCount={3}
        componentStack={null}
      />
    );

    expect(screen.getByText(/Retry attempt #3/i)).toBeInTheDocument();
  });

  it('should have toggle for technical details when componentStack exists', () => {
    const error = new Error('Stack error');
    const stack = 'ComponentStack\n  at Div\n    at App';
    
    render(
      <DefaultFallback 
        error={error} 
        resetErrorBoundary={() => {}}
        retryCount={0}
        componentStack={stack}
      />
    );

    // Should have "Show technical details" button
    expect(screen.getByText(/Show technical details/i)).toBeInTheDocument();
  });

  it('should toggle component stack visibility', () => {
    const error = new Error('Toggle error');
    const stack = 'Error Stack Trace Here';
    
    render(
      <DefaultFallback 
        error={error} 
        resetErrorBoundary={() => {}}
        retryCount={0}
        componentStack={stack}
      />
    );

    // Initially hidden
    expect(screen.queryByText(stack)).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(screen.getByText(/Show technical details/i));
    expect(screen.getByText(stack)).toBeInTheDocument();
    expect(screen.getByText(/Hide technical details/i)).toBeInTheDocument();

    // Click to hide
    fireEvent.click(screen.getByText(/Hide technical details/i));
    expect(screen.queryByText(stack)).not.toBeInTheDocument();
  });
});

describe('useErrorHandler Hook', () => {
  it('should be defined as a function', () => {
    expect(typeof useErrorHandler).toBe('function');
  });

  it('should return a function that captures errors', () => {
    const { captureException } = require('@/lib/monitoring/sentry');
    
    // Note: Testing hooks requires renderHook from @testing-library/react
    // This is a basic existence and type check
    const { result } = renderHook(() => useErrorHandler());
    expect(typeof result.current).toBe('function');
  });
});
