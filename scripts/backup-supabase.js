import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { format } from 'date-fns';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

async function backupEverything() {
  console.log('🔄 Starting Supabase backup...\n');
  
  const backup = {
    timestamp: new Date().toISOString(),
    version: 'pre-migration',
    data: {}
  };
  
  try {
    // Backup posts with exact data
    console.log('📄 Backing up posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');
    
    if (postsError) throw postsError;
    backup.data.posts = posts;
    console.log(`✅ Backed up ${posts.length} posts with exact publish dates`);
    
    // Backup user credits
    console.log('\n💳 Backing up user credits...');
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*');
    
    if (creditsError) throw creditsError;
    backup.data.user_credits = credits;
    console.log(`✅ Backed up ${credits.length} credit records`);
    
    // Backup auth users (for verification) - optional
    console.log('\n👤 Backing up auth users (optional)...');
    try {
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;
      backup.data.auth_users = users;
      console.log(`✅ Backed up ${users.length} auth users`);
    } catch (authError) {
      console.log(`⚠️  Could not backup auth users: ${authError.message}`);
      console.log('   This is optional - continuing with posts and credits...');
    }
    
    // Save backup file
    const filename = `backup-supabase-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`\n✨ Backup complete: ${filename}`);
    console.log(`📊 Total size: ${(JSON.stringify(backup).length / 1024).toFixed(2)} KB`);
    
    return filename;
  } catch (error) {
    console.error('\n❌ Backup failed:', error.message);
    
    // Try to save partial backup
    if (backup.data.posts || backup.data.user_credits) {
      const filename = `backup-supabase-partial-${timestamp}.json`;
      writeFileSync(filename, JSON.stringify(backup, null, 2));
      console.log(`⚠️  Partial backup saved: ${filename}`);
    }
    
    throw error;
  }
}

backupEverything()
  .then(filename => {
    console.log(`\n✅ Ready to proceed with migration\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Backup failed:', error.message);
    process.exit(1);
  });