/**
 * Keyboard Shortcuts Help Component
 * 
 * Displays available keyboard shortcuts for the filter system.
 * Shows shortcuts in a modal dialog with MC Law blue styling.
 */

import React, { useState, useEffect } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import '../../styles/advanced-filter.css';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerModal, unregisterModal, getShortcuts, formatShortcut } = useKeyboardNavigation();
  const [modalRef, setModalRef] = useState<HTMLElement | null>(null);

  // Register modal for keyboard navigation
  useEffect(() => {
    if (isOpen && modalRef) {
      registerModal(modalRef);
      return () => {
        unregisterModal(modalRef);
      };
    }
  }, [isOpen, modalRef, registerModal, unregisterModal]);

  // Get all shortcuts
  const shortcuts = getShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = {
    navigation: shortcuts.filter(s => 
      s.description.toLowerCase().includes('focus') || 
      s.description.toLowerCase().includes('open')
    ),
    actions: shortcuts.filter(s => 
      s.description.toLowerCase().includes('save') || 
      s.description.toLowerCase().includes('view') ||
      s.description.toLowerCase().includes('clear') ||
      s.description.toLowerCase().includes('apply')
    ),
    other: shortcuts.filter(s => 
      !s.description.toLowerCase().includes('focus') &&
      !s.description.toLowerCase().includes('open') &&
      !s.description.toLowerCase().includes('save') &&
      !s.description.toLowerCase().includes('view') &&
      !s.description.toLowerCase().includes('clear') &&
      !s.description.toLowerCase().includes('apply')
    ),
  };

  if (!isOpen) return null;

  return (
    <div 
      className="filter-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div
        ref={setModalRef}
        className="filter-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px' }}
      >
        {/* Header */}
        <div className="filter-modal-header">
          <h2 id="keyboard-shortcuts-title" className="filter-modal-title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className="filter-modal-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
            data-modal-close
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="filter-modal-content">
          {/* Navigation Shortcuts */}
          {groupedShortcuts.navigation.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--mc-gold)',
                  marginBottom: '12px',
                }}
              >
                Navigation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedShortcuts.navigation.map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'var(--filter-bg-light)',
                      borderRadius: 'var(--filter-radius-md)',
                    }}
                  >
                    <span style={{ color: 'var(--filter-text)', fontSize: '0.875rem' }}>
                      {shortcut.description}
                    </span>
                    <kbd className="keyboard-shortcut-hint">
                      {formatShortcut(shortcut).split('+').map((key, i, arr) => (
                        <React.Fragment key={i}>
                          <span className="keyboard-shortcut-key">{key}</span>
                          {i < arr.length - 1 && <span>+</span>}
                        </React.Fragment>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Shortcuts */}
          {groupedShortcuts.actions.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--mc-gold)',
                  marginBottom: '12px',
                }}
              >
                Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedShortcuts.actions.map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'var(--filter-bg-light)',
                      borderRadius: 'var(--filter-radius-md)',
                    }}
                  >
                    <span style={{ color: 'var(--filter-text)', fontSize: '0.875rem' }}>
                      {shortcut.description}
                    </span>
                    <kbd className="keyboard-shortcut-hint">
                      {formatShortcut(shortcut).split('+').map((key, i, arr) => (
                        <React.Fragment key={i}>
                          <span className="keyboard-shortcut-key">{key}</span>
                          {i < arr.length - 1 && <span>+</span>}
                        </React.Fragment>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Shortcuts */}
          {groupedShortcuts.other.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--mc-gold)',
                  marginBottom: '12px',
                }}
              >
                Other
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedShortcuts.other.map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'var(--filter-bg-light)',
                      borderRadius: 'var(--filter-radius-md)',
                    }}
                  >
                    <span style={{ color: 'var(--filter-text)', fontSize: '0.875rem' }}>
                      {shortcut.description}
                    </span>
                    <kbd className="keyboard-shortcut-hint">
                      {formatShortcut(shortcut).split('+').map((key, i, arr) => (
                        <React.Fragment key={i}>
                          <span className="keyboard-shortcut-key">{key}</span>
                          {i < arr.length - 1 && <span>+</span>}
                        </React.Fragment>
                      ))}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Tips */}
          <div
            style={{
              padding: '16px',
              background: 'var(--mc-gold-light)',
              borderRadius: 'var(--filter-radius-md)',
              border: '1px solid var(--mc-gold)',
            }}
          >
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--mc-gold)',
                marginBottom: '8px',
              }}
            >
              Tips
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: '20px',
                color: 'var(--filter-text)',
                fontSize: '0.8125rem',
                lineHeight: 1.6,
              }}
            >
              <li>Press <kbd className="keyboard-shortcut-hint"><span className="keyboard-shortcut-key">Tab</span></kbd> to navigate between elements</li>
              <li>Press <kbd className="keyboard-shortcut-hint"><span className="keyboard-shortcut-key">Esc</span></kbd> to close modals and dropdowns</li>
              <li>Press <kbd className="keyboard-shortcut-hint"><span className="keyboard-shortcut-key">Enter</span></kbd> to activate buttons and links</li>
              <li>Press <kbd className="keyboard-shortcut-hint"><span className="keyboard-shortcut-key">Space</span></kbd> to toggle checkboxes</li>
              <li>Use <kbd className="keyboard-shortcut-hint"><span className="keyboard-shortcut-key">↑</span></kbd> <kbd className="keyboard-shortcut-hint"><span className="keyboard-shortcut-key">↓</span></kbd> to navigate suggestions</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="filter-modal-footer" style={{ padding: '20px', borderTop: '1px solid var(--filter-border-light)' }}>
          <button
            type="button"
            className="filter-button filter-button-primary"
            onClick={onClose}
            style={{ width: '100%' }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
