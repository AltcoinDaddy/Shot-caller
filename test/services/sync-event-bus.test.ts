/**
 * Unit Tests for Sync Event Bus
 * Tests event subscription, emission, and management functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEventBus } from '@/lib/services/sync-event-bus';
import { SyncEventType, SyncEvent } from '@/lib/types/sync';

describe('SyncEventBus', () => {
  let eventBus: SyncEventBus;

  beforeEach(() => {
    eventBus = new SyncEventBus({ debugMode: false });
  });

  describe('Event Subscription', () => {
    it('should allow subscribing to events', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow multiple subscribers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      const unsubscribe1 = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler1);
      const unsubscribe2 = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler2);
      
      expect(typeof unsubscribe1).toBe('function');
      expect(typeof unsubscribe2).toBe('function');
      
      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });

    it('should return correct listener count', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
      
      const unsubscribe1 = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler1);
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      
      const unsubscribe2 = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler2);
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(2);
      
      unsubscribe1();
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      
      unsubscribe2();
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit events to subscribers', () => {
      const handler = vi.fn();
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      const testEvent: SyncEvent = {
        type: SyncEventType.WALLET_CONNECTED,
        timestamp: new Date(),
        data: { address: '0x123' },
        source: 'test'
      };
      
      eventBus.emit(testEvent);
      
      expect(handler).toHaveBeenCalledWith(testEvent);
    });

    it('should emit events using emitEvent helper', () => {
      const handler = vi.fn();
      eventBus.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, handler);
      
      const testData = { collectionCount: 5 };
      eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, testData, 'test-source');
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SyncEventType.NFT_COLLECTION_UPDATED,
          data: testData,
          source: 'test-source',
          timestamp: expect.any(Date)
        })
      );
    });

    it('should call all subscribers for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, handler1);
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, handler2);
      eventBus.subscribe(SyncEventType.PROFILE_SYNC_COMPLETED, handler3);
      
      eventBus.emitEvent(SyncEventType.PROFILE_SYNC_COMPLETED, { success: true }, 'test');
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('should not fail when emitting to non-existent event type', () => {
      const testEvent: SyncEvent = {
        type: SyncEventType.SYNC_ERROR,
        timestamp: new Date(),
        data: {},
        source: 'test'
      };
      
      expect(() => eventBus.emit(testEvent)).not.toThrow();
    });

    it('should handle errors in event handlers gracefully', () => {
      const faultyHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();
      
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, faultyHandler);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, goodHandler);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      expect(faultyHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Event Unsubscription', () => {
    it('should unsubscribe handlers correctly', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      // Emit event - should be received
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Unsubscribe
      unsubscribe();
      
      // Emit event again - should not be received
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribing non-existent handler', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      // Unsubscribe twice
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should clean up empty event type entries', () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      
      unsubscribe();
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
    });
  });

  describe('Multiple Event Subscription', () => {
    it('should subscribe to multiple events with same handler', () => {
      const handler = vi.fn();
      const eventTypes = [
        SyncEventType.WALLET_CONNECTED,
        SyncEventType.WALLET_DISCONNECTED,
        SyncEventType.NFT_COLLECTION_UPDATED
      ];
      
      const unsubscribe = eventBus.subscribeToMultiple(eventTypes, handler);
      
      // Emit each event type
      eventTypes.forEach(eventType => {
        eventBus.emitEvent(eventType, {}, 'test');
      });
      
      expect(handler).toHaveBeenCalledTimes(3);
      
      // Unsubscribe from all
      unsubscribe();
      
      // Emit events again - should not be received
      eventTypes.forEach(eventType => {
        eventBus.emitEvent(eventType, {}, 'test');
      });
      
      expect(handler).toHaveBeenCalledTimes(3); // Still 3, no new calls
    });
  });

  describe('Event History', () => {
    it('should maintain event history', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { address: '0x123' }, 'test');
      eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, { count: 5 }, 'test');
      
      const history = eventBus.getEventHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe(SyncEventType.WALLET_CONNECTED);
      expect(history[1].type).toBe(SyncEventType.NFT_COLLECTION_UPDATED);
    });

    it('should filter event history by type', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      const walletEvents = eventBus.getEventHistory(SyncEventType.WALLET_CONNECTED);
      const nftEvents = eventBus.getEventHistory(SyncEventType.NFT_COLLECTION_UPDATED);
      
      expect(walletEvents).toHaveLength(2);
      expect(nftEvents).toHaveLength(1);
    });

    it('should limit event history', () => {
      const limitedEventBus = new SyncEventBus({ maxHistorySize: 3 });
      
      // Emit more events than the limit
      for (let i = 0; i < 5; i++) {
        limitedEventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { index: i }, 'test');
      }
      
      const history = limitedEventBus.getEventHistory();
      
      expect(history).toHaveLength(3);
      // Should keep the most recent events
      expect(history[0].data.index).toBe(2);
      expect(history[2].data.index).toBe(4);
    });

    it('should limit returned history with limit parameter', () => {
      // Emit several events
      for (let i = 0; i < 10; i++) {
        eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { index: i }, 'test');
      }
      
      const limitedHistory = eventBus.getEventHistory(undefined, 3);
      
      expect(limitedHistory).toHaveLength(3);
      // Should return the last 3 events
      expect(limitedHistory[0].data.index).toBe(7);
      expect(limitedHistory[2].data.index).toBe(9);
    });

    it('should clear event history', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, {}, 'test');
      
      expect(eventBus.getEventHistory()).toHaveLength(2);
      
      eventBus.clearHistory();
      
      expect(eventBus.getEventHistory()).toHaveLength(0);
    });

    it('should clear specific event type from history', () => {
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      eventBus.emitEvent(SyncEventType.NFT_COLLECTION_UPDATED, {}, 'test');
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      expect(eventBus.getEventHistory()).toHaveLength(3);
      
      eventBus.clearHistory(SyncEventType.WALLET_CONNECTED);
      
      const remainingHistory = eventBus.getEventHistory();
      expect(remainingHistory).toHaveLength(1);
      expect(remainingHistory[0].type).toBe(SyncEventType.NFT_COLLECTION_UPDATED);
    });
  });

  describe('Active Event Types', () => {
    it('should return active event types with listener counts', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler1);
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler2);
      eventBus.subscribe(SyncEventType.NFT_COLLECTION_UPDATED, handler1);
      
      const activeTypes = eventBus.getActiveEventTypes();
      
      expect(activeTypes.get(SyncEventType.WALLET_CONNECTED)).toBe(2);
      expect(activeTypes.get(SyncEventType.NFT_COLLECTION_UPDATED)).toBe(1);
      expect(activeTypes.has(SyncEventType.PROFILE_SYNC_STARTED)).toBe(false);
    });
  });

  describe('Wait for Event', () => {
    it('should resolve when event is emitted', async () => {
      const eventPromise = eventBus.waitForEvent(SyncEventType.WALLET_CONNECTED);
      
      // Emit the event after a short delay
      setTimeout(() => {
        eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, { address: '0x123' }, 'test');
      }, 10);
      
      const event = await eventPromise;
      
      expect(event.type).toBe(SyncEventType.WALLET_CONNECTED);
      expect(event.data.address).toBe('0x123');
    });

    it('should timeout if event is not emitted', async () => {
      const eventPromise = eventBus.waitForEvent(SyncEventType.WALLET_CONNECTED, 100);
      
      await expect(eventPromise).rejects.toThrow('Timeout waiting for event');
    });

    it('should resolve immediately if event is emitted before timeout', async () => {
      const eventPromise = eventBus.waitForEvent(SyncEventType.WALLET_CONNECTED, 1000);
      
      // Emit immediately
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      const event = await eventPromise;
      expect(event.type).toBe(SyncEventType.WALLET_CONNECTED);
    });
  });

  describe('Debug Mode', () => {
    it('should log debug information when enabled', () => {
      const debugEventBus = new SyncEventBus({ debugMode: true });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const handler = vi.fn();
      debugEventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed to WALLET_CONNECTED')
      );
      
      debugEventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Emitting WALLET_CONNECTED')
      );
      
      consoleSpy.mockRestore();
    });

    it('should allow toggling debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      eventBus.setDebugMode(true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug mode enabled')
      );
      
      eventBus.setDebugMode(false);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug mode disabled')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should destroy event bus and clear all data', () => {
      const handler = vi.fn();
      eventBus.subscribe(SyncEventType.WALLET_CONNECTED, handler);
      eventBus.emitEvent(SyncEventType.WALLET_CONNECTED, {}, 'test');
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(1);
      expect(eventBus.getEventHistory()).toHaveLength(1);
      
      eventBus.destroy();
      
      expect(eventBus.getListenerCount(SyncEventType.WALLET_CONNECTED)).toBe(0);
      expect(eventBus.getEventHistory()).toHaveLength(0);
    });
  });
});