import { InMemoryStorage } from '../stores/memory/index';
import { storage } from '../data/storage';

async function migrateStorage(): Promise<void> {
  console.log('Starting storage migration...');
  
  // Initialize in-memory storage
  const inMemoryStorage = new InMemoryStorage();
  
  // Check if migration is needed
  // This would typically check if a migration flag exists
  const hasMigrationFlag = false; // Placeholder
  
  if (!hasMigrationFlag) {
    console.log('Migration needed. Moving data from in-memory to SQLite...');
    
    // Migrate data
    await inMemoryStorage.migrateToPersistentStorage(storage);
    
    // Update migration flag
    // This would typically be saved to a file
    console.log('Migration completed successfully!');
  } else {
    console.log('Storage is already migrated. Skipping migration.');
  }
}

// Run migration
migrateStorage().catch(err => {
  console.error('Migration failed:', err);
});
