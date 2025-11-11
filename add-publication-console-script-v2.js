// Script to add 1994-1995 Composite publication via browser console
// This version uses the existing SearchContext
// Copy and paste this entire script into the browser console

(async function() {
  try {
    console.log('🚀 Starting publication import...');
    
    // Get the search manager from the existing context
    console.log('📦 Getting search manager from context...');
    
    // Access the React component tree to get the search context
    const rootElement = document.querySelector('#root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }
    
    // Get React internal instance
    const reactRoot = rootElement._reactRootContainer || rootElement._reactRoot;
    if (!reactRoot) {
      throw new Error('React root not found. Make sure the app is loaded.');
    }
    
    // Alternative: Use the window object if SearchContext exposes it
    console.log('🔍 Looking for database manager...');
    
    // Try to import and use the search context directly
    const { useSearch } = await import('/src/lib/search-context.tsx');
    
    console.log('⚠️  Note: We need to access the search manager from a React component.');
    console.log('');
    console.log('📝 Alternative approach: Let\'s add the record directly to localStorage');
    console.log('');
    
    // Get existing database from localStorage
    const dbKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('database')) {
        dbKeys.push(key);
      }
    }
    
    console.log('Found database keys:', dbKeys);
    
    if (dbKeys.length === 0) {
      console.log('');
      console.log('⚠️  No database found in localStorage.');
      console.log('');
      console.log('🔄 Please try this instead:');
      console.log('1. Navigate to Publications Room first');
      console.log('2. Wait for it to load');
      console.log('3. Then run this script again');
      return;
    }
    
    // Import sql.js to work with the database
    console.log('📦 Loading sql.js...');
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs({
      locateFile: file => `/node_modules/sql.js/dist/${file}`
    });
    
    console.log('✅ sql.js loaded');
    
    // Load the database from localStorage
    const dbKey = dbKeys[0];
    const dbData = localStorage.getItem(dbKey);
    
    if (!dbData) {
      throw new Error('Database data not found');
    }
    
    console.log('📂 Loading database...');
    const binaryString = atob(dbData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const db = new SQL.Database(bytes);
    console.log('✅ Database loaded');
    
    // Insert the publication record
    console.log('📝 Inserting publication record...');
    db.run(`
      INSERT INTO publications (
        title, 
        pub_name, 
        issue_date, 
        volume_issue, 
        flipbook_path, 
        description,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      'Class Composite 1994-1995',
      'Directory',
      '1995-05',
      '1994-1995',
      '/flipbooks/composite-1994-1995/index.html',
      'Class composite for the 1994-1995 academic year'
    ]);
    
    console.log('✅ Publication record added!');
    
    // Verify the record
    console.log('🔍 Verifying record...');
    const results = db.exec(`
      SELECT * FROM publications 
      WHERE title = 'Class Composite 1994-1995'
    `);
    
    if (results.length > 0 && results[0].values.length > 0) {
      console.log('✅ Verification successful!');
      console.log('📄 Record:', results[0]);
      
      // Save the database back to localStorage
      console.log('💾 Saving database...');
      const exportedData = db.export();
      const base64Data = btoa(String.fromCharCode(...exportedData));
      localStorage.setItem(dbKey, base64Data);
      
      console.log('✅ Database saved!');
      console.log('');
      console.log('🎉 SUCCESS! The 1994-1995 composite flipbook has been added.');
      console.log('');
      console.log('Next steps:');
      console.log('1. Refresh the page (F5)');
      console.log('2. Navigate to Publications Room');
      console.log('3. Search for "1994" or "composite"');
      console.log('4. Click on the publication');
      console.log('5. Click "View Flipbook"');
    } else {
      console.error('❌ Verification failed - record not found');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure you\'re on the main page (http://localhost:8080/)');
    console.error('2. Navigate to Publications Room first to initialize the database');
    console.error('3. Then come back to home and run this script');
    console.error('4. Or try refreshing the page and running again');
  }
})();
