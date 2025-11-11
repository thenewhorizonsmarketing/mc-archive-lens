// Database schema definitions for SQLite FTS5 search system

export const CREATE_ALUMNI_TABLE = `
  CREATE TABLE IF NOT EXISTS alumni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    class_year INTEGER,
    role TEXT,
    composite_image_path TEXT,
    portrait_path TEXT,
    caption TEXT,
    tags TEXT,
    sort_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_ALUMNI_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS alumni_fts USING fts5(
    full_name, caption, tags, role,
    content='alumni',
    content_rowid='id',
    tokenize='porter unicode61'
  );
`;

export const CREATE_PUBLICATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    pub_name TEXT NOT NULL CHECK(pub_name IN ('Amicus', 'Legal Eye', 'Law Review', 'Directory')),
    issue_date TEXT,
    volume_issue TEXT,
    pdf_path TEXT,
    flipbook_path TEXT,
    thumb_path TEXT,
    description TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_PUBLICATIONS_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS publications_fts USING fts5(
    title, description, tags, pub_name, volume_issue,
    content='publications',
    content_rowid='id',
    tokenize='porter unicode61'
  );
`;

export const CREATE_PHOTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection TEXT NOT NULL,
    title TEXT NOT NULL,
    year_or_decade TEXT,
    image_path TEXT NOT NULL,
    caption TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_PHOTOS_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS photos_fts USING fts5(
    title, caption, tags, collection, year_or_decade,
    content='photos',
    content_rowid='id',
    tokenize='porter unicode61'
  );
`;

export const CREATE_FACULTY_TABLE = `
  CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    headshot_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_FACULTY_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS faculty_fts USING fts5(
    full_name, title, department,
    content='faculty',
    content_rowid='id',
    tokenize='porter unicode61'
  );
`;

// Indexes for frequently queried columns
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_alumni_class_year ON alumni(class_year);',
  'CREATE INDEX IF NOT EXISTS idx_alumni_sort_key ON alumni(sort_key);',
  'CREATE INDEX IF NOT EXISTS idx_publications_pub_name ON publications(pub_name);',
  'CREATE INDEX IF NOT EXISTS idx_publications_issue_date ON publications(issue_date);',
  'CREATE INDEX IF NOT EXISTS idx_photos_collection ON photos(collection);',
  'CREATE INDEX IF NOT EXISTS idx_photos_year_decade ON photos(year_or_decade);',
  'CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);'
];

// Triggers to keep FTS5 tables synchronized with core tables
export const CREATE_ALUMNI_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS alumni_fts_insert AFTER INSERT ON alumni BEGIN
    INSERT INTO alumni_fts(rowid, full_name, caption, tags, role) 
    VALUES (new.id, new.full_name, new.caption, new.tags, new.role);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS alumni_fts_delete AFTER DELETE ON alumni BEGIN
    INSERT INTO alumni_fts(alumni_fts, rowid, full_name, caption, tags, role) 
    VALUES('delete', old.id, old.full_name, old.caption, old.tags, old.role);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS alumni_fts_update AFTER UPDATE ON alumni BEGIN
    INSERT INTO alumni_fts(alumni_fts, rowid, full_name, caption, tags, role) 
    VALUES('delete', old.id, old.full_name, old.caption, old.tags, old.role);
    INSERT INTO alumni_fts(rowid, full_name, caption, tags, role) 
    VALUES (new.id, new.full_name, new.caption, new.tags, new.role);
  END;`
];

export const CREATE_PUBLICATIONS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS publications_fts_insert AFTER INSERT ON publications BEGIN
    INSERT INTO publications_fts(rowid, title, description, tags, pub_name, volume_issue) 
    VALUES (new.id, new.title, new.description, new.tags, new.pub_name, new.volume_issue);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS publications_fts_delete AFTER DELETE ON publications BEGIN
    INSERT INTO publications_fts(publications_fts, rowid, title, description, tags, pub_name, volume_issue) 
    VALUES('delete', old.id, old.title, old.description, old.tags, old.pub_name, old.volume_issue);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS publications_fts_update AFTER UPDATE ON publications BEGIN
    INSERT INTO publications_fts(publications_fts, rowid, title, description, tags, pub_name, volume_issue) 
    VALUES('delete', old.id, old.title, old.description, old.tags, old.pub_name, old.volume_issue);
    INSERT INTO publications_fts(rowid, title, description, tags, pub_name, volume_issue) 
    VALUES (new.id, new.title, new.description, new.tags, new.pub_name, new.volume_issue);
  END;`
];

export const CREATE_PHOTOS_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS photos_fts_insert AFTER INSERT ON photos BEGIN
    INSERT INTO photos_fts(rowid, title, caption, tags, collection, year_or_decade) 
    VALUES (new.id, new.title, new.caption, new.tags, new.collection, new.year_or_decade);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS photos_fts_delete AFTER DELETE ON photos BEGIN
    INSERT INTO photos_fts(photos_fts, rowid, title, caption, tags, collection, year_or_decade) 
    VALUES('delete', old.id, old.title, old.caption, old.tags, old.collection, old.year_or_decade);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS photos_fts_update AFTER UPDATE ON photos BEGIN
    INSERT INTO photos_fts(photos_fts, rowid, title, caption, tags, collection, year_or_decade) 
    VALUES('delete', old.id, old.title, old.caption, old.tags, old.collection, old.year_or_decade);
    INSERT INTO photos_fts(rowid, title, caption, tags, collection, year_or_decade) 
    VALUES (new.id, new.title, new.caption, new.tags, new.collection, new.year_or_decade);
  END;`
];

export const CREATE_FACULTY_TRIGGERS = [
  `CREATE TRIGGER IF NOT EXISTS faculty_fts_insert AFTER INSERT ON faculty BEGIN
    INSERT INTO faculty_fts(rowid, full_name, title, department) 
    VALUES (new.id, new.full_name, new.title, new.department);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS faculty_fts_delete AFTER DELETE ON faculty BEGIN
    INSERT INTO faculty_fts(faculty_fts, rowid, full_name, title, department) 
    VALUES('delete', old.id, old.full_name, old.title, old.department);
  END;`,
  
  `CREATE TRIGGER IF NOT EXISTS faculty_fts_update AFTER UPDATE ON faculty BEGIN
    INSERT INTO faculty_fts(faculty_fts, rowid, full_name, title, department) 
    VALUES('delete', old.id, old.full_name, old.title, old.department);
    INSERT INTO faculty_fts(rowid, full_name, title, department) 
    VALUES (new.id, new.full_name, new.title, new.department);
  END;`
];

// Metadata table to track import history and system state
export const CREATE_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// ============================================================================
// MIGRATIONS
// ============================================================================

/**
 * Migration to add flipbook_path column to publications table
 * This migration is safe to run multiple times (idempotent)
 */
export const MIGRATION_ADD_FLIPBOOK_PATH = `
  -- Check if column exists before adding
  -- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we use a workaround
  -- This will fail silently if the column already exists
  ALTER TABLE publications ADD COLUMN flipbook_path TEXT;
`;

/**
 * Migration to make pdf_path nullable (for publications that only have flipbooks)
 * Note: SQLite doesn't support modifying column constraints directly
 * This is handled by the updated CREATE_PUBLICATIONS_TABLE schema
 */
export const MIGRATION_MAKE_PDF_PATH_NULLABLE = `
  -- This migration is handled by recreating the table with the new schema
  -- The CREATE_PUBLICATIONS_TABLE now has pdf_path without NOT NULL constraint
`;

export const ALL_MIGRATIONS = [
  MIGRATION_ADD_FLIPBOOK_PATH
];

export const ALL_TABLES = [
  CREATE_ALUMNI_TABLE,
  CREATE_PUBLICATIONS_TABLE,
  CREATE_PHOTOS_TABLE,
  CREATE_FACULTY_TABLE,
  CREATE_METADATA_TABLE
];

export const ALL_FTS_TABLES = [
  CREATE_ALUMNI_FTS,
  CREATE_PUBLICATIONS_FTS,
  CREATE_PHOTOS_FTS,
  CREATE_FACULTY_FTS
];

export const ALL_TRIGGERS = [
  ...CREATE_ALUMNI_TRIGGERS,
  ...CREATE_PUBLICATIONS_TRIGGERS,
  ...CREATE_PHOTOS_TRIGGERS,
  ...CREATE_FACULTY_TRIGGERS
];