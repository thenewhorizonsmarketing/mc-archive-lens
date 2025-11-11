// Script to add 1994-1995 Composite publication via browser console
// Copy and paste this entire script into the browser console

(async function() {
  try {
    console.log('🚀 Starting publication import...');
    
    // Import database connection
    const { dbConnection } = await import('/src/lib/database/connection.ts');
    
    console.log('📦 Connecting to database...');
    await dbConnection.connect();
    const manager = dbConnection.getManager();
    
    console.log('✅ Database connected');
    
    // Insert publication record
    console.log('📝 Inserting publication record...');
    manager.executeStatement(`
      INSERT INTO publications (
        title, 
        pub_name, 
        issue_date, 
        volume_issue, 
        flipbook_path, 
        description,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      'Class Composite 1994-1995',
      'Directory',
      '1995-05',
      '1994-1995',
      '/flipbooks/composite-1994-1995/index.html',
      'Class composite for the 1994-1995 academic year'
    ]);
    
    console.log('✅ Publication record added successfully!');
    
    // Verify the record was added
    console.log('🔍 Verifying record...');
    const results = manager.executeQuery(`
      SELECT * FROM publications 
      WHERE title = 'Class Composite 1994-1995'
    `);
    
    if (results.length > 0) {
      console.log('✅ Verification successful!');
      console.log('📄 Record details:', results[0]);
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
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('');
    console.error('If you see an error, try:');
    console.error('1. Refresh the page');
    console.error('2. Run this script again');
  }
})();
