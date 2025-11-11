// Simple script to add publication directly to localStorage database
// Copy and paste this into browser console

(async function() {
  try {
    console.log('🚀 Starting simple publication import...');
    
    // Find database in localStorage
    console.log('🔍 Searching for database in localStorage...');
    let dbKey = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('kiosk') || key.includes('database') || key.includes('db'))) {
        console.log('Found potential database key:', key);
        dbKey = key;
        break;
      }
    }
    
    if (!dbKey) {
      console.log('');
      console.log('⚠️  No database found in localStorage.');
      console.log('');
      console.log('📋 All localStorage keys:');
      for (let i = 0; i < localStorage.length; i++) {
        console.log(`  - ${localStorage.key(i)}`);
      }
      console.log('');
      console.log('🔄 Please:');
      console.log('1. Navigate to Publications Room');
      console.log('2. Wait for data to load');
      console.log('3. Come back and run this script again');
      return;
    }
    
    console.log(`✅ Found database at key: ${dbKey}`);
    
    // Load sql.js
    console.log('📦 Loading sql.js...');
    const initSqlJs = (await import('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js')).default;
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    console.log('✅ sql.js loaded');
    
    // Load database from localStorage
    console.log('📂 Loading database from localStorage...');
    const dbData = localStorage.getItem(dbKey);
    const binaryString = atob(dbData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const db = new SQL.Database(bytes);
    console.log('✅ Database loaded');
    
    // Check if record already exists
    console.log('🔍 Checking for existing record...');
    const existing = db.exec(`
      SELECT * FROM publications 
      WHERE title = 'Class Composite 1994-1995'
    `);
    
    if (existing.length > 0 && existing[0].values.length > 0) {
      console.log('⚠️  Record already exists!');
      console.log('📄 Existing record:', existing[0]);
      db.close();
      return;
    }
    
    // Insert the publication
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
    console.log('✅ Record inserted');
    
    // Verify
    console.log('🔍 Verifying...');
    const results = db.exec(`
      SELECT * FROM publications 
      WHERE title = 'Class Composite 1994-1995'
    `);
    
    if (results.length > 0 && results[0].values.length > 0) {
      console.log('✅ Verification successful!');
      
      // Save back to localStorage
      console.log('💾 Saving database back to localStorage...');
      const exportedData = db.export();
      const base64Data = btoa(String.fromCharCode(...exportedData));
      localStorage.setItem(dbKey, base64Data);
      console.log('✅ Database saved!');
      
      console.log('');
      console.log('🎉 SUCCESS!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Refresh the page (F5)');
      console.log('2. Go to Publications Room');
      console.log('3. Search for "1994"');
      console.log('4. Click "View Flipbook"');
    } else {
      console.error('❌ Verification failed');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('');
    console.error('Stack trace:', error.stack);
  }
})();
