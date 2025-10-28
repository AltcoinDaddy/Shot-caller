import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncEventBus, SYNC_EVENTS } from '../sync-event-bus';
import { SyncEventType, SyncEvent } from '@/lib/types/sync';

describe('SyncEventBus', () => {
  let eventBus: SyncEventBus;
  let mockHandler: ReturnType<typeof vi.fn>;
  let mockHandler2: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    eventBus = new SyncEventBus({ debugMode: false });
    mockHandler = vi.fn();
    mockHandler2 = vi.fn();
  });

  afterEach(() => {
    eventBus.destroy();
    vi.clearAllMocks();
  });

  describe('Event Subscription', () => {
    it('should subscribe to events and return unsubscribe function', () => {
      const unsubscribe = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      
      expect(typeof unsubscribe).toBe('function');
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
    });

    it('should allow multiple handlers for the same event type', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler2);
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(2);
    });

    it('should unsubscribe handlers correctly', () => {
      const unsubscribe1 = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      const unsubscribe2 = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler2);
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(2);
      
      unsubscribe1();
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      
      unsubscribe2();
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
    });

    it('should handle unsubscribing non-existent handlers gracefully', () => {
      const unsubscribe = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      
      // Unsubscribe twice should not throw
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    it('should emit events to subscribed handlers', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      
      const testEvent: SyncEvent = {
        type: SyncEventType.WALLET_CONNECTED,
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };
      
      eventBus.emit(testEvent);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(testEvent);
    });

    it('should emit events to multiple handlers', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler2);
      
      const testEvent: SyncEvent = {
        type: SyncEventType.WALLET_CONNECTED,
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };
      
      eventBus.emit(testEvent);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler2).toHaveBeenCalledTimes(1);
    });

    it('should not emit to handlers of different event types', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      eventBus.subscribe(SyncEventType.WALLET_DISCONNECTED, mockHandler2);
      
      const testEvent: SyncEvent = {
        type: SyncEventType.WALLET_CONNECTED,
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };
      
      eventBus.emit(testEvent);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler2).not.toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, errorHandler);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      
      const testEvent: SyncEvent = {
        type: SyncEventType.WALLET_CONNECTED,
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };
      
      expect(() => eventBus.emit(testEvent)).not.toThrow();
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('EmitEvent Helper', () => {
    it('should create and emit events with emitEvent helper', () => {
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_STARTED, mockHandler);
      
      const testData = { operation: 'nft-sync' };
      const testSource = 'sync-manager';
      
      eventBus.emitEvent(SyncEventType.PROFILE_SYNC_STARTED, testData, testSource);
      
      expect(mockHandler).toHaveBeenCalledTimes(1);
      
      const emittedEvent = mockHandler.mock.calls[0][0];
      expect(emittedEvent.type).toBe(SyncEventType.PROFILE_SYNC_STARTED);
      expect(emittedEvent.data).toEqual(testData);
      expect(emittedEvent.source).toBe(testSource);
      expect(emittedEvent.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Multiple Event Subscription', () => {
    it('should subscribe to multiple event types with one handler', () => {
      const eventTypes = [
        SyncEventType.WALLET_CONNECTED,
        SyncEventType.WALLET_DISCONNECTED,
        SyncEventType.NFT_COLLECTION_UPDATED
      ];
      
      const unsubscribe = eventBus.subscribeToMultiple(eventTypes, mockHandler);
      
      eventTypes.forEach(eventType => {
        expect(eventBus.getListenerCount(eventType)).toBe(1);
      });
      
      // Test unsubscribe removes all
      unsubscribe();
      
      eventTypes.forEach(eventType => {
        expect(eventBus.getListenerCount(eventType)).toBe(0);
      });
    });

    it('should call handler for any of the subscribed event types', () => {
      const eventTypes = [
        SyncEventType.WALLET_CONNECTED,
        SyncEventType.WALLET_DISCONNECTED
      ];
      
      eventBus.subscribeToMultiple(eventTypes, mockHandler);
      
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_DISCONNECTED, {}, 'test');
      
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event History', () => {
    it('should maintain event history', () => {
      const testEvent1: SyncEvent = {
        type: SyncEventType.WALLET_CONNECTED,
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };
      
      const testEvent2: SyncEvent = {
        type: SyncEventType.WALLET_DISCONNECTED,
        timestamp: new Date(),
        data: {},
        source: 'test'
      };
      
      eventBus.emit(testEvent1);
      eventBus.emit(testEvent2);
      
      const history = eventBus.getEventHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(testEvent1);
      expect(history[1]).toEqual(testEvent2);
    });

    it('should filter event history by type', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_DISCONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      const connectedEvents = eventBus.getEventHistory(SyncEventType.WALLET_CONNECTED);
      expect(connectedEvents).toHaveLength(2);
      
      const disconnectedEvents = eventBus.getEventHistory(SyncEventType.WALLET_DISCONNECTED);
      expect(disconnectedEvents).toHaveLength(1);
    });

    it('should limit event history size', () => {
      const limitedEventBus = new SyncEventBus({ maxHistorySize: 3 });
      
      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        limitedEventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { index: i }, 'test');
      }
      
      const history = limitedEventBus.getEventHistory();
      expect(history).toHaveLength(3);
      
      // Should keep the last 3 events
      expect(history[0].data.index).toBe(2);
      expect(history[1].data.index).toBe(3);
      expect(history[2].data.index).toBe(4);
      
      limitedEventBus.destroy();
    });

    it('should limit returned events when limit parameter is provided', () => {
      // Emit 5 events
      for (let i = 0; i < 5; i++) {
        eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { index: i }, 'test');
      }
      
      const limitedHistory = eventBus.getEventHistory(undefined, 2);
      expect(limitedHistory).toHaveLength(2);
      
      // Should return the last 2 events
      expect(limitedHistory[0].data.index).toBe(3);
      expect(limitedHistory[1].data.index).toBe(4);
    });

    it('should clear event history', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_DISCONNECTED, {}, 'test');
      
      expect(eventBus.getEventHistory()).toHaveLength(2);
      
      eventBus.clearHistory();
      expect(eventBus.getEventHistory()).toHaveLength(0);
    });

    it('should clear event history by type', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_DISCONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      expect(eventBus.getEventHistory()).toHaveLength(3);
      
      eventBus.clearHistory(SyncEventType.WALLET_CONNECTED);
      
      const remainingHistory = eventBus.getEventHistory();
      expect(remainingHistory).toHaveLength(1);
      expect(remainingHistory[0].type).toBe(SyncEventType.WALLET_DISCONNECTED);
    });

    it('should return copy of history to prevent mutation', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      const history1 = eventBus.getEventHistory();
      const history2 = eventBus.getEventHistory();
      
      expect(history1).not.toBe(history2); // Different array instances
      expect(history1).toEqual(history2); // Same content
    });
  });

  describe('Listener Management', () => {
    it('should return correct listener count', () => {
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
      
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler2);
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(2);
    });

    it('should return active event types with counts', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler2);
      eventBus.subscribe(SyncEventType.WALLET_DISCONNECTED, mockHandler);
      
      const activeTypes = eventBus.getActiveEventTypes();
      
      expect(activeTypes.size).toBe(2);
      expect(activeTypes.get(SyncEventType.WALLET_CONNECTED)).toBe(2);
      expect(activeTypes.get(SyncEventType.WALLET_DISCONNECTED)).toBe(1);
    });
  });

  describe('Debug Mode', () => {
    it('should enable and disable debug mode', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      eventBus.setDebugMode(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('[SyncEventBus] Debug mode enabled');
      
      eventBus.setDebugMode(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('[SyncEventBus] Debug mode disabled');
      
      consoleLogSpy.mockRestore();
    });

    it('should log subscription events in debug mode', () => {
      const debugEventBus = new SyncEventBus({ debugMode: true });
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const unsubscribe = debugEventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed to wallet_connected')
      );
      
      unsubscribe();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsubscribed from wallet_connected')
      );
      
      consoleLogSpy.mockRestore();
      debugEventBus.destroy();
    });
  });

  describe('Wait for Event', () => {
    it('should resolve when expected event is emitted', async () => {
      const eventPromise = eventBus.waitForEvent(SyncEventType.WALLET_CONNECTED);
      
      // Emit the event after a short delay
      setTimeout(() => {
        eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { address: '0x123' }, 'test');
      }, 10);
      
      const event = await eventPromise;
      expect(event.type).toBe(SyncEventType.WALLET_CONNECTED);
      expect(event.data.address).toBe('0x123');
    });

    it('should timeout if event is not emitted within timeout period', async () => {
      const eventPromise = eventBus.waitForEvent(SyncEventType.WALLET_CONNECTED, 50);
      
      await expect(eventPromise).rejects.toThrow(
        'Timeout waiting for event wallet_connected after 50ms'
      );
    });

    it('should not timeout if no timeout is specified', async () => {
      const eventPromise = eventBus.waitForEvent(SyncEventType.WALLET_CONNECTED);
      
      // Emit event after 100ms
      setTimeout(() => {
        eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      }, 100);
      
      const event = await eventPromise;
      expect(event.type).toBe(SyncEventType.WALLET_CONNECTED);
    });
  });

  describe('Destroy', () => {
    it('should clear all listeners and history when destroyed', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      eventBus.subscribe(SyncEventType.WALLET_DISCONNECTED, mockHandler2);
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      expect(eventBus.getEventHistory()).toHaveLength(1);
      
      eventBus.destroy();
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
      expect(eventBus.getListenerCount(SyncEventType.WALLET_DISCONNECTED)).toBe(0);
      expect(eventBus.getEventHistory()).toHaveLength(0);
    });
  });

  describe('SYNC_EVENTS Constants', () => {
    it('should export event type constants', () => {
      expect(SYNC_EVENTS.WALLET_CONNECTED).toBe(SyncEventType.WALLET_CONNECTED);
      expect(SYNC_EVENTS.WALLET_DISCONNECTED).toBe(SyncEventType.WALLET_DISCONNECTED);
      expect(SYNC_EVENTS.NFT_COLLECTION_UPDATED).toBe(SyncEventType.NFT_COLLECTION_UPDATED);
      expect(SYNC_EVENTS.PROFILE_SYNC_STARTED).toBe(SyncEventType.PROFILE_SYNC_STARTED);
      expect(SYNC_EVENTS.PROFILE_SYNC_COMPLETED).toBe(SyncEventType.PROFILE_SYNC_COMPLETED);
      expect(SYNC_EVENTS.SYNC_ERROR).toBe(SyncEventType.SYNC_ERROR);
    });
  });

  describe('Edge Cases', () => {
    it('should handle emitting events with no listeners', () => {
      expect(() => {
        eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      }).not.toThrow();
    });

    it('should handle subscribing the same handler multiple times', () => {
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, mockHandler);
      
      // Should only be added once due to Set behavior
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle large event data objects', () => {
      const largeData = {
        nfts: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `NFT ${i}` })),
        metadata: { timestamp: Date.now(), source: 'blockchain' }
      };
      
      eventBus.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, mockHandler);
      
      expect(() => {
        eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, largeData, 'test');
      }).not.toThrow();
      
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: largeData
        })
      );
    });
  });
});