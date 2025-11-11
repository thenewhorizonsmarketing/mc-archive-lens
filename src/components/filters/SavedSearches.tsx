/**
 * SavedSearches Component
 * 
 * Displays saved search presets in a grid with MC Blue cards.
 * Provides quick load, edit, and delete functionality.
 */

import React, { useState, useEffect } from 'react';
import {
  getSavedSearchManager,
  type SavedSearch,
} from '../../lib/filters/SavedSearchManager';
import type { FilterConfig } from '../../lib/filters/types';
import './SavedSearches.css';

interface SavedSearchesProps {
  onLoad: (filters: FilterConfig) => void;
  onClose?: () => void;
  currentFilters?: FilterConfig;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  onLoad,
  onClose,
  currentFilters,
}) => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [newSearchDescription, setNewSearchDescription] = useState('');

  const manager = getSavedSearchManager();

  const loadSearches = () => {
    let loadedSearches = manager.getAll();

    // Apply search filter
    if (searchQuery) {
      loadedSearches = manager.search(searchQuery);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        loadedSearches.sort(
          (a, b) => b.lastUsed.getTime() - a.lastUsed.getTime()
        );
        break;
      case 'popular':
        loadedSearches.sort((a, b) => b.useCount - a.useCount);
        break;
      case 'name':
        loadedSearches.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setSearches(loadedSearches);
  };

  useEffect(() => {
    loadSearches();
  }, [sortBy, searchQuery]);

  const handleLoad = (search: SavedSearch) => {
    manager.load(search.id);
    onLoad(search.filters);
    loadSearches(); // Refresh to update usage stats
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved search?')) {
      manager.delete(id);
      loadSearches();
    }
  };

  const handleEdit = (search: SavedSearch, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(search.id);
    setEditName(search.name);
    setEditDescription(search.description || '');
  };

  const handleSaveEdit = (id: string) => {
    manager.update(id, {
      name: editName,
      description: editDescription || undefined,
    });
    setEditingId(null);
    loadSearches();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    manager.duplicate(id);
    loadSearches();
  };

  const handleSaveNew = () => {
    if (!newSearchName.trim() || !currentFilters) return;

    manager.save(
      newSearchName.trim(),
      currentFilters,
      newSearchDescription.trim() || undefined
    );
    setShowSaveDialog(false);
    setNewSearchName('');
    setNewSearchDescription('');
    loadSearches();
  };

  const stats = manager.getStatistics();

  return (
    <div className="saved-searches-container">
      <div className="saved-searches-header">
        <h2>Saved Searches</h2>
        {onClose && (
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close saved searches"
          >
            ×
          </button>
        )}
      </div>

      <div className="saved-searches-stats">
        <div className="stat-item">
          <span className="stat-value">{stats.totalSearches}</span>
          <span className="stat-label">Saved</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.totalUses}</span>
          <span className="stat-label">Total Uses</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.averageUseCount.toFixed(1)}</span>
          <span className="stat-label">Avg Uses</span>
        </div>
      </div>

      <div className="saved-searches-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search saved searches..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search saved searches"
        />

        <div className="sort-controls">
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="recent">Recently Used</option>
            <option value="popular">Most Popular</option>
            <option value="name">Name</option>
          </select>
        </div>

        {currentFilters && (
          <button
            className="save-current-button"
            onClick={() => setShowSaveDialog(true)}
          >
            + Save Current Search
          </button>
        )}
      </div>

      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={e => e.stopPropagation()}>
            <h3>Save Current Search</h3>
            <input
              type="text"
              className="dialog-input"
              placeholder="Search name *"
              value={newSearchName}
              onChange={e => setNewSearchName(e.target.value)}
              autoFocus
            />
            <textarea
              className="dialog-textarea"
              placeholder="Description (optional)"
              value={newSearchDescription}
              onChange={e => setNewSearchDescription(e.target.value)}
              rows={3}
            />
            <div className="dialog-actions">
              <button
                className="dialog-button cancel"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button
                className="dialog-button save"
                onClick={handleSaveNew}
                disabled={!newSearchName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="saved-searches-grid">
        {searches.length === 0 ? (
          <div className="empty-state">
            <p>No saved searches yet.</p>
            <p className="empty-state-hint">
              Save your frequently used searches for quick access.
            </p>
          </div>
        ) : (
          searches.map(search => (
            <div
              key={search.id}
              className="saved-search-card"
              onClick={() => handleLoad(search)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLoad(search);
                }
              }}
            >
              {editingId === search.id ? (
                <div className="edit-form" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    className="edit-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                  <textarea
                    className="edit-textarea"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={2}
                  />
                  <div className="edit-actions">
                    <button
                      className="edit-button save"
                      onClick={() => handleSaveEdit(search.id)}
                    >
                      Save
                    </button>
                    <button
                      className="edit-button cancel"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="card-header">
                    <h3 className="card-title">{search.name}</h3>
                    <div className="card-actions">
                      <button
                        className="action-button edit"
                        onClick={e => handleEdit(search, e)}
                        aria-label="Edit search"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="action-button duplicate"
                        onClick={e => handleDuplicate(search.id, e)}
                        aria-label="Duplicate search"
                        title="Duplicate"
                      >
                        ⎘
                      </button>
                      <button
                        className="action-button delete"
                        onClick={e => handleDelete(search.id, e)}
                        aria-label="Delete search"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {search.description && (
                    <p className="card-description">{search.description}</p>
                  )}

                  <div className="card-metadata">
                    <span className="metadata-item">
                      <span className="metadata-icon">🔍</span>
                      Used {search.useCount} {search.useCount === 1 ? 'time' : 'times'}
                    </span>
                    <span className="metadata-item">
                      <span className="metadata-icon">📅</span>
                      {formatDate(search.lastUsed)}
                    </span>
                  </div>

                  <div className="card-footer">
                    <button className="load-button">
                      Load Search
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
