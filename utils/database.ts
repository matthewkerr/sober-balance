import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Utility function to calculate days by calendar date (not exact 24-hour periods)
// This means if someone starts on Thursday night and checks on Friday morning,
// it will count as 1 day (not 0.5 days like the exact time calculation would)
export function calculateSobrietyDaysByDate(soberDate: string): number {
  const sober = new Date(soberDate);
  const now = new Date();
  
  // Reset time to start of day for both dates (midnight)
  const soberStart = new Date(sober.getFullYear(), sober.getMonth(), sober.getDate());
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate difference in days
  const timeDiff = nowStart.getTime() - soberStart.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  
  // Debug logging (can be removed later)
  // console.log('Sobriety calculation:', {
  //   soberDate: soberDate,
  //   soberStart: soberStart.toISOString(),
  //   nowStart: nowStart.toISOString(),
  //   timeDiff: timeDiff,
  //   daysDiff: daysDiff
  // });
  
  return daysDiff;
}

// Database interface
export interface Encouragement {
  id?: number;
  message: string;
  seen: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: number;
  name: string;
  has_completed_onboarding: boolean;
  setup_step: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupportPerson {
  id?: number;
  name: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface SobrietyData {
  id?: number;
  tracking_sobriety: boolean;
  tracking_mode: 'sober' | 'trying'; // 'sober' for days sober, 'trying' for days trying to be sober
  sober_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserReason {
  id?: number;
  reason: string;
  created_at?: string;
}

export interface JournalEntry {
  id?: number;
  content: string;
  timestamp: string;
  created_at?: string;
  updated_at?: string;
}

export interface Intention {
  id?: number;
  content: string;
  timestamp: string;
  created_at?: string;
  updated_at?: string;
}

export interface DailyCheckIn {
  id?: number;
  goal: string;
  energy: 'low' | 'medium' | 'high';
  tone: 'sad' | 'calm' | 'happy';
  thankful: string;
  date: string;
  created_at?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  // Retry mechanism for failed operations
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3, delayMs: number = 1000): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Operation failed after ${maxRetries} attempts:`, error);
          throw error;
        }
        console.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw new Error('Retry mechanism failed unexpectedly');
  }

  async init(): Promise<void> {
    try {
      // Close existing database connection if any
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          // console.warn('Error closing existing database:', error);
        }
      }
      
      // Open database
      this.db = await SQLite.openDatabaseAsync('sober_balance.db');
      
      // Check if we need to migrate the database
      await this.migrateDatabase();
      
      // Create tables
      await this.createTables();
      
      // Seed encouragements if table is empty
      await this.seedEncouragements();
      
      // Try to restore data from backup if database is empty
      await this.restoreDataIfNeeded();
      
      // console.log('Database initialized successfully');
    } catch (error) {
      // console.error('Error initializing database:', error);
      // Reset database connection on error
      this.db = null;
      throw error;
    }
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if daily_check_ins table exists and has the old schema
      const tableInfo = await this.db.getAllAsync<{ name: string; type: string }>(
        "PRAGMA table_info(daily_check_ins)"
      );

      if (tableInfo.length > 0) {
        // Table exists, check if it has the old 'feeling' column
        const hasFeelingColumn = tableInfo.some(column => column.name === 'feeling');
        
        if (hasFeelingColumn) {
          // console.log('Migrating daily_check_ins table to remove feeling column...');
          
          // Create new table with correct schema
          await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS daily_check_ins_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              goal TEXT NOT NULL,
              energy TEXT NOT NULL,
              tone TEXT NOT NULL,
              thankful TEXT NOT NULL,
              date TEXT NOT NULL UNIQUE,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);

          // Copy data from old table to new table (excluding feeling column)
          await this.db.execAsync(`
            INSERT INTO daily_check_ins_new (goal, energy, tone, thankful, date, created_at)
            SELECT goal, energy, tone, thankful, date, created_at FROM daily_check_ins;
          `);

          // Drop old table
          await this.db.execAsync('DROP TABLE daily_check_ins;');

          // Rename new table to original name
          await this.db.execAsync('ALTER TABLE daily_check_ins_new RENAME TO daily_check_ins;');

          // console.log('Database migration completed successfully');
        }
      }

      // Add updated_at column to journal_entries table if it doesn't exist
      const journalTableInfo = await this.db.getAllAsync<{ name: string; type: string }>(
        "PRAGMA table_info(journal_entries)"
      );
      
      if (journalTableInfo.length > 0) {
        const hasUpdatedAtColumn = journalTableInfo.some(column => column.name === 'updated_at');
        
        if (!hasUpdatedAtColumn) {
          // console.log('Adding updated_at column to journal_entries table...');
          try {
            // First add the column without default
            await this.db.execAsync('ALTER TABLE journal_entries ADD COLUMN updated_at DATETIME');
            // Then update existing rows with current timestamp
            await this.db.execAsync('UPDATE journal_entries SET updated_at = created_at WHERE updated_at IS NULL');
          } catch (error) {
            // console.warn('Failed to add updated_at column to journal_entries:', error);
          }
        }
      }

      // Add updated_at column to intentions table if it doesn't exist
      const intentionsTableInfo = await this.db.getAllAsync<{ name: string; type: string }>(
        "PRAGMA table_info(intentions)"
      );
      
      if (intentionsTableInfo.length > 0) {
        const hasUpdatedAtColumn = intentionsTableInfo.some(column => column.name === 'updated_at');
        
        if (!hasUpdatedAtColumn) {
          // console.log('Adding updated_at column to intentions table...');
          try {
            // First add the column without default
            await this.db.execAsync('ALTER TABLE intentions ADD COLUMN updated_at DATETIME');
            // Then update existing rows with current timestamp
            await this.db.execAsync('UPDATE intentions SET updated_at = created_at WHERE updated_at IS NULL');
          } catch (error) {
            // console.warn('Failed to add updated_at column to intentions:', error);
          }
        }
      }

      // Add tracking_mode column to sobriety_data table if it doesn't exist
      const sobrietyTableInfo = await this.db.getAllAsync<{ name: string; type: string }>(
        "PRAGMA table_info(sobriety_data)"
      );
      
      if (sobrietyTableInfo.length > 0) {
        const hasTrackingModeColumn = sobrietyTableInfo.some(column => column.name === 'tracking_mode');
        
        if (!hasTrackingModeColumn) {
          // console.log('Adding tracking_mode column to sobriety_data table...');
          try {
            // Add the column with default value 'sober' for existing data
            await this.db.execAsync('ALTER TABLE sobriety_data ADD COLUMN tracking_mode TEXT DEFAULT "sober"');
            // Update existing rows to have 'sober' as the default tracking mode
            await this.db.execAsync('UPDATE sobriety_data SET tracking_mode = "sober" WHERE tracking_mode IS NULL');
          } catch (error) {
            // console.warn('Failed to add tracking_mode column to sobriety_data:', error);
          }
        }
      }
    } catch (error) {
      // console.error('Error during database migration:', error);
      // If migration fails, we'll continue with normal table creation
      // which will handle the case where the table doesn't exist
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create encouragements table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS encouragements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        seen BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        has_completed_onboarding BOOLEAN DEFAULT 0,
        setup_step INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create support_persons table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS support_persons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sobriety_data table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sobriety_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_sobriety BOOLEAN DEFAULT 0,
        tracking_mode TEXT NOT NULL,
        sober_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_reasons table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_reasons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sos_logs table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sos_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create journal_entries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create intentions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS intentions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create daily_check_ins table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_check_ins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal TEXT NOT NULL,
        energy TEXT NOT NULL,
        tone TEXT NOT NULL,
        thankful TEXT NOT NULL,
        date TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // console.log('Tables created successfully');
  }

  private async seedEncouragements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if encouragements table is empty
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM encouragements'
    );

    if (result && result.count === 0) {
      // console.log('Seeding encouragements...');
      
      // Import the seed data
      const encouragementsData = require('../seeders/encouragements_seed.json');
      
      // Insert all encouragements
      for (const encouragement of encouragementsData) {
        await this.db.runAsync(
          'INSERT INTO encouragements (message, seen) VALUES (?, ?)',
          [encouragement.message, encouragement.seen ? 1 : 0]
        );
      }
      
      // console.log(`Seeded ${encouragementsData.length} encouragements`);
    }
  }

  // Encouragement methods
  async getRandomEncouragement(): Promise<Encouragement | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for encouragement:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<Encouragement>(
        'SELECT * FROM encouragements ORDER BY RANDOM() LIMIT 1'
      );
      
      return result || null;
    } catch (error) {
      // console.error('Error getting random encouragement:', error);
      return null;
    }
  }

  async getRandomUnseenEncouragement(): Promise<Encouragement | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for unseen encouragement:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<Encouragement>(
        'SELECT * FROM encouragements WHERE seen = 0 ORDER BY RANDOM() LIMIT 1'
      );
      
      return result || null;
    } catch (error) {
      // console.error('Error getting random encouragement:', error);
      return null;
    }
  }

  async markEncouragementAsSeen(id: number): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for marking encouragement:', error);
        return;
      }
    }

    try {
      await this.db!.runAsync(
        'UPDATE encouragements SET seen = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      // console.error('Error marking encouragement as seen:', error);
      throw error;
    }
  }

  async resetAllEncouragements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE encouragements SET seen = 0, updated_at = CURRENT_TIMESTAMP'
      );
      // console.log('All encouragements reset');
    } catch (error) {
      // console.error('Error resetting encouragements:', error);
      throw error;
    }
  }

  async getEncouragementStats(): Promise<{ total: number; seen: number; unseen: number }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const total = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM encouragements'
      );
      
      const seen = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM encouragements WHERE seen = 1'
      );

      return {
        total: total?.count || 0,
        seen: seen?.count || 0,
        unseen: (total?.count || 0) - (seen?.count || 0)
      };
    } catch (error) {
      // console.error('Error getting encouragement stats:', error);
      return { total: 0, seen: 0, unseen: 0 };
    }
  }

  // User methods
  async createUser(name: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(
        'INSERT INTO users (name) VALUES (?)',
        [name]
      );
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(): Promise<User | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for user:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<User>(
        'SELECT * FROM users ORDER BY id DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      // console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUserOnboarding(hasCompleted: boolean, setupStep: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE users SET has_completed_onboarding = ?, setup_step = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM users ORDER BY id DESC LIMIT 1)',
        [hasCompleted ? 1 : 0, setupStep]
      );
      
      // Backup data after successful update
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after user onboarding update:', error);
      }
    } catch (error) {
      // console.error('Error updating user onboarding:', error);
      throw error;
    }
  }

  async updateUserName(name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM users ORDER BY id DESC LIMIT 1)',
        [name]
      );
      
      // Backup data after successful update
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after user name update:', error);
      }
    } catch (error) {
      // console.error('Error updating user name:', error);
      throw error;
    }
  }

  // Support person methods
  async saveSupportPerson(name: string, phone: string): Promise<number> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for support person:', error);
        throw new Error('Database initialization failed');
      }
    }

    try {
      // Clear existing support person first
      await this.db!.runAsync('DELETE FROM support_persons');
      
      const result = await this.db!.runAsync(
        'INSERT INTO support_persons (name, phone) VALUES (?, ?)',
        [name, phone]
      );
      
      // Backup data after successful save
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after support person save:', error);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error saving support person:', error);
      throw error;
    }
  }

  async getSupportPerson(): Promise<SupportPerson | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for support person:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<SupportPerson>(
        'SELECT * FROM support_persons ORDER BY id DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      // console.error('Error getting support person:', error);
      return null;
    }
  }

  // Sobriety data methods
  async saveSobrietyData(trackingSobriety: boolean, trackingMode: 'sober' | 'trying', soberDate?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Clear existing sobriety data first
      await this.db.runAsync('DELETE FROM sobriety_data');
      
      const result = await this.db.runAsync(
        'INSERT INTO sobriety_data (tracking_sobriety, tracking_mode, sober_date) VALUES (?, ?, ?)',
        [trackingSobriety ? 1 : 0, trackingMode, soberDate || null]
      );
      
      // Backup data after successful save
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after sobriety data save:', error);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error saving sobriety data:', error);
      throw error;
    }
  }

  async getSobrietyData(): Promise<SobrietyData | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for sobriety data:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<SobrietyData>(
        'SELECT * FROM sobriety_data ORDER BY id DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      // console.error('Error getting sobriety data:', error);
      return null;
    }
  }

  // User reasons methods
  async saveUserReasons(reasons: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Clear existing reasons first
      await this.db.runAsync('DELETE FROM user_reasons');
      
      // Insert new reasons
      for (const reason of reasons) {
        await this.db.runAsync(
          'INSERT INTO user_reasons (reason) VALUES (?)',
          [reason]
        );
      }
      
      // Backup data after successful save
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after user reasons save:', error);
      }
    } catch (error) {
      // console.error('Error saving user reasons:', error);
      throw error;
    }
  }

  // SOS logging methods
  async logSOSActivation(timestamp: string): Promise<number> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for SOS logging:', error);
        return 0;
      }
    }

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO sos_logs (timestamp) VALUES (?)',
        [timestamp]
      );
      
      // Backup data after successful logging
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after SOS log creation:', error);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error logging SOS activation:', error);
      return 0;
    }
  }

  async getSOSLogs(): Promise<{ id: number; timestamp: string }[]> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for SOS logs:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<{ id: number; timestamp: string }>(
        'SELECT id, timestamp FROM sos_logs ORDER BY timestamp DESC LIMIT 50'
      );
      return results;
    } catch (error) {
      // console.error('Error getting SOS logs:', error);
      return [];
    }
  }

  async getUserReasons(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<UserReason>(
        'SELECT reason FROM user_reasons ORDER BY id'
      );
      return results.map(r => r.reason);
    } catch (error) {
      // console.error('Error getting user reasons:', error);
      return [];
    }
  }

  // Journal methods
  async createJournalEntry(content: string): Promise<number> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for journal entry:', error);
        return 0;
      }
    }

    try {
      const timestamp = new Date().toISOString();
      const result = await this.db!.runAsync(
        'INSERT INTO journal_entries (content, timestamp) VALUES (?, ?)',
        [content, timestamp]
      );
      
      // Backup data after successful creation
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after journal entry creation:', error);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error creating journal entry:', error);
      return 0;
    }
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for journal entries:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<JournalEntry>(
        'SELECT * FROM journal_entries ORDER BY timestamp DESC'
      );
      return results;
    } catch (error) {
      // console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for journal entry:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<JournalEntry>(
        'SELECT * FROM journal_entries WHERE id = ?',
        [id]
      );
      return result || null;
    } catch (error) {
      // console.error('Error getting journal entry:', error);
      return null;
    }
  }

  async updateJournalEntry(id: number, content: string): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for journal entry update:', error);
        throw new Error('Database initialization failed');
      }
    }

    try {
      // First try with updated_at column
      await this.db!.runAsync(
        'UPDATE journal_entries SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, id]
      );
    } catch (error) {
      // console.warn('Failed to update with updated_at column, trying without:', error);
      try {
        // Fallback: update without updated_at column
        await this.db!.runAsync(
          'UPDATE journal_entries SET content = ? WHERE id = ?',
          [content, id]
        );
      } catch (fallbackError) {
        // console.error('Error updating journal entry:', fallbackError);
        throw fallbackError;
      }
    }
    
    // Backup data after successful update
    try {
      await this.backupData();
    } catch (error) {
      // console.warn('Failed to backup data after journal entry update:', error);
    }
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for journal entry deletion:', error);
        throw new Error('Database initialization failed');
      }
    }

    try {
      await this.db!.runAsync(
        'DELETE FROM journal_entries WHERE id = ?',
        [id]
      );
      
      // Backup data after successful deletion
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after journal entry deletion:', error);
      }
    } catch (error) {
      // console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Intention methods
  async createIntention(content: string): Promise<number> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for intention:', error);
        return 0;
      }
    }

    try {
      const timestamp = new Date().toISOString();
      const result = await this.db!.runAsync(
        'INSERT INTO intentions (content, timestamp) VALUES (?, ?)',
        [content, timestamp]
      );
      
      // Backup data after successful creation
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after intention creation:', error);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error creating intention:', error);
      return 0;
    }
  }

  async getIntentions(): Promise<Intention[]> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for intentions:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<Intention>(
        'SELECT * FROM intentions ORDER BY timestamp DESC'
      );
      return results;
    } catch (error) {
      // console.error('Error getting intentions:', error);
      return [];
    }
  }

  async getCurrentIntention(): Promise<Intention | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for current intention:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<Intention>(
        'SELECT * FROM intentions ORDER BY timestamp DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      // console.error('Error getting current intention:', error);
      return null;
    }
  }

  async updateIntention(id: number, content: string): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for intention update:', error);
        throw new Error('Database initialization failed');
      }
    }

    try {
      // First try with updated_at column
      await this.db!.runAsync(
        'UPDATE intentions SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, id]
      );
    } catch (error) {
      // console.warn('Failed to update with updated_at column, trying without:', error);
      try {
        // Fallback: update without updated_at column
        await this.db!.runAsync(
          'UPDATE intentions SET content = ? WHERE id = ?',
          [content, id]
        );
      } catch (fallbackError) {
        // console.error('Error updating intention:', fallbackError);
        throw fallbackError;
      }
    }
    
    // Backup data after successful update
    try {
      await this.backupData();
    } catch (error) {
      // console.warn('Failed to backup data after intention update:', error);
    }
  }

  async deleteIntention(id: number): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for intention deletion:', error);
        throw new Error('Database initialization failed');
      }
    }

    try {
      await this.db!.runAsync(
        'DELETE FROM intentions WHERE id = ?',
        [id]
      );
      
      // Backup data after successful deletion
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after intention deletion:', error);
      }
    } catch (error) {
      // console.error('Error deleting intention:', error);
      throw error;
    }
  }

  // Daily Check-In methods
  async createDailyCheckIn(
    goal: string,
    energy: 'low' | 'medium' | 'high',
    tone: 'sad' | 'calm' | 'happy',
    thankful: string
  ): Promise<number> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for daily check-in:', error);
        return 0;
      }
    }

    try {
      // Get today's date in YYYY-MM-DD format (calendar day, not 24-hour period)
      const now = new Date();
      const today = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
      
      console.log('Creating daily check-in for date:', today);
      
      const result = await this.db!.runAsync(
        'INSERT INTO daily_check_ins (goal, energy, tone, thankful, date) VALUES (?, ?, ?, ?, ?)',
        [goal, energy, tone, thankful, today]
      );
      
      // Backup data after successful creation
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after daily check-in creation:', error);
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      // console.error('Error creating daily check-in:', error);
      return 0;
    }
  }

  async getTodayCheckIn(): Promise<DailyCheckIn | null> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for today check-in:', error);
        return null;
      }
    }

    try {
      // Get today's date in YYYY-MM-DD format (calendar day, not 24-hour period)
      const now = new Date();
      const today = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
      
      // Debug logging to help troubleshoot
      console.log('Checking for today\'s check-in:', {
        today: today,
        currentTime: now.toISOString(),
        localTime: now.toLocaleString()
      });
      
      const result = await this.db!.getFirstAsync<DailyCheckIn>(
        'SELECT * FROM daily_check_ins WHERE date = ?',
        [today]
      );
      
      console.log('Today check-in result:', result ? 'Found check-in' : 'No check-in found');
      
      return result || null;
    } catch (error) {
      console.error('Error getting today check-in:', error);
      return null;
    }
  }

  async getCheckInHistory(): Promise<DailyCheckIn[]> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for check-in history:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<DailyCheckIn>(
        'SELECT * FROM daily_check_ins ORDER BY date DESC LIMIT 30'
      );
      
      // Debug logging to help troubleshoot
      console.log('Check-in history:', results.map(r => ({ date: r.date, created_at: r.created_at })));
      
      return results;
    } catch (error) {
      // console.error('Error getting check-in history:', error);
      return [];
    }
  }

  // Debug method to check daily check-in status
  async debugCheckInStatus(): Promise<void> {
    if (!this.db) {
      console.log('Database not initialized');
      return;
    }

    try {
      const now = new Date();
      const today = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
      
      console.log('=== DAILY CHECK-IN DEBUG ===');
      console.log('Current time:', now.toLocaleString());
      console.log('Today\'s date (YYYY-MM-DD):', today);
      
      // Get all check-ins from the last 3 days
      const recentCheckIns = await this.db.getAllAsync<DailyCheckIn>(
        'SELECT * FROM daily_check_ins WHERE date >= ? ORDER BY date DESC',
        [now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate() - 2).padStart(2, '0')]
      );
      
      console.log('Recent check-ins:');
      recentCheckIns.forEach(checkIn => {
        console.log(`- Date: ${checkIn.date}, Created: ${checkIn.created_at}, Goal: ${checkIn.goal.substring(0, 30)}...`);
      });
      
      // Check if today's check-in exists
      const todayCheckIn = await this.db.getFirstAsync<DailyCheckIn>(
        'SELECT * FROM daily_check_ins WHERE date = ?',
        [today]
      );
      
      console.log('Today\'s check-in exists:', !!todayCheckIn);
      if (todayCheckIn) {
        console.log('Today\'s check-in details:', {
          date: todayCheckIn.date,
          created_at: todayCheckIn.created_at,
          goal: todayCheckIn.goal.substring(0, 50) + '...'
        });
      }
      
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Error in debug check-in status:', error);
    }
  }

  // Clear today's check-in (for debugging)
  async clearTodayCheckIn(): Promise<void> {
    if (!this.db) {
      console.log('Database not initialized');
      return;
    }

    try {
      const now = new Date();
      const today = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
      
      console.log('Clearing today\'s check-in for date:', today);
      
      const result = await this.db.runAsync(
        'DELETE FROM daily_check_ins WHERE date = ?',
        [today]
      );
      
      console.log('Cleared check-ins:', result.changes);
      
      // Backup data after clearing
      try {
        await this.backupData();
      } catch (error) {
        console.warn('Failed to backup data after clearing today\'s check-in:', error);
      }
    } catch (error) {
      console.error('Error clearing today\'s check-in:', error);
    }
  }

  // Debug methods
  async debugLogAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // console.log('=== Database Debug Info ===');
      
      const user = await this.getUser();
      // console.log('User:', user);
      
      const supportPerson = await this.getSupportPerson();
      // console.log('Support Person:', supportPerson);
      
      const sobrietyData = await this.getSobrietyData();
      // console.log('Sobriety Data:', sobrietyData);
      
      const userReasons = await this.getUserReasons();
      // console.log('User Reasons:', userReasons);
      
      const encouragementStats = await this.getEncouragementStats();
      // console.log('Encouragement Stats:', encouragementStats);
      
      const journalEntries = await this.getJournalEntries();
      // console.log('Journal Entries:', journalEntries.length);
      
      const intentions = await this.getIntentions();
      // console.log('Intentions:', intentions.length);
      
      const checkIns = await this.getCheckInHistory();
      // console.log('Daily Check-ins:', checkIns.length);
      
      // console.log('===========================');
    } catch (error) {
      // console.error('Error logging database data:', error);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for clearing data:', error);
        return;
      }
    }

    try {
      await this.db!.runAsync('DELETE FROM users');
      await this.db!.runAsync('DELETE FROM support_persons');
      await this.db!.runAsync('DELETE FROM sobriety_data');
      await this.db!.runAsync('DELETE FROM user_reasons');
      await this.db!.runAsync('DELETE FROM sos_logs');
      await this.db!.runAsync('DELETE FROM journal_entries');
      await this.db!.runAsync('DELETE FROM intentions');
      await this.db!.runAsync('DELETE FROM daily_check_ins');
      await this.db!.runAsync('UPDATE encouragements SET seen = 0');
      
      // Backup data after clearing (to preserve the cleared state)
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after clearing:', error);
      }
      
      // console.log('All data cleared');
    } catch (error) {
      // console.error('Error clearing all data:', error);
      throw error;
    }
  }

  async clearUserData(): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for clearing user data:', error);
        return;
      }
    }

    try {
      // Delete all user-generated data
      await this.db!.runAsync('DELETE FROM users');
      await this.db!.runAsync('DELETE FROM support_persons');
      await this.db!.runAsync('DELETE FROM sobriety_data');
      await this.db!.runAsync('DELETE FROM user_reasons');
      await this.db!.runAsync('DELETE FROM sos_logs');
      await this.db!.runAsync('DELETE FROM journal_entries');
      await this.db!.runAsync('DELETE FROM intentions');
      await this.db!.runAsync('DELETE FROM daily_check_ins');
      
      // Reset encouragements to unliked state (preserve the seeded messages)
      await this.db!.runAsync('UPDATE encouragements SET seen = 0');
      
      // Backup data after clearing (to preserve the cleared state)
      try {
        await this.backupData();
      } catch (error) {
        // console.warn('Failed to backup data after user data clearing:', error);
      }
      
      // console.log('User data cleared, encouragements preserved');
    } catch (error) {
      // console.error('Error clearing user data:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    try {
      // Close and reset database connection
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          // console.warn('Error closing database:', error);
        }
      }
      
      this.db = null;
      
      // Reinitialize database
      await this.init();
      
      // console.log('Database reset successfully');
    } catch (error) {
      // console.error('Error resetting database:', error);
      throw error;
    }
  }

  // Backup all user data to AsyncStorage to prevent data loss during app updates
  async backupData(): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for backup:', error);
        return;
      }
    }

    try {
      // Get all user data
      const user = await this.getUser();
      const supportPerson = await this.getSupportPerson();
      const sobrietyData = await this.getSobrietyData();
      const userReasons = await this.getUserReasons();
      const journalEntries = await this.getJournalEntries();
      const intentions = await this.getIntentions();
      const dailyCheckIns = await this.getCheckInHistory();
      const sosLogs = await this.getSOSLogs();

      // Create backup object
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0', // Track backup format version
        user,
        supportPerson,
        sobrietyData,
        userReasons,
        journalEntries,
        intentions,
        dailyCheckIns,
        sosLogs
      };

      // Validate backup size before saving
      const backupString = JSON.stringify(backup);
      const backupSize = backupString.length;
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      if (backupSize > maxSize) {
        console.warn(`Backup size (${Math.round(backupSize / 1024)}KB) exceeds recommended limit (${Math.round(maxSize / 1024)}KB)`);
        // Still save the backup but log the warning
      }

      // Save to AsyncStorage with retry mechanism
      await this.retryOperation(async () => {
        await AsyncStorage.setItem('sober_balance_backup', backupString);
      }, 3, 500);
      
      console.log(`Data backed up successfully (${Math.round(backupSize / 1024)}KB, ${new Date().toISOString()})`);
    } catch (error) {
      console.error('Error backing up data:', error);
      throw error; // Re-throw to allow calling code to handle the error
    }
  }

  // Restore data from backup if database is empty
  async restoreDataIfNeeded(): Promise<void> {
    if (!this.db) {
      // console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        // console.error('Failed to initialize database for restore:', error);
        return;
      }
    }

    try {
      // Check if database has any user data
      const userCount = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM users'
      );
      
      // Check for any user-generated content
      const [journalCount, intentionCount, checkInCount, supportCount, sobrietyCount] = await Promise.all([
        this.db!.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM journal_entries'),
        this.db!.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM intentions'),
        this.db!.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM daily_check_ins'),
        this.db!.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM support_persons'),
        this.db!.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sobriety_data')
      ]);

      // If database has user AND any content, no need to restore
      const hasUserData = userCount && userCount.count > 0;
      const hasAnyContent = (journalCount && journalCount.count > 0) ||
                           (intentionCount && intentionCount.count > 0) ||
                           (checkInCount && checkInCount.count > 0) ||
                           (supportCount && supportCount.count > 0) ||
                           (sobrietyCount && sobrietyCount.count > 0);

      if (hasUserData && hasAnyContent) {
        // console.log('Database has user data and content, no restore needed');
        return;
      }

      // Try to restore from backup with retry mechanism
      const backupData = await this.retryOperation(async () => {
        return await AsyncStorage.getItem('sober_balance_backup');
      }, 3, 500);
      if (!backupData) {
        console.log('No backup data found - starting with fresh data');
        return;
      }

      const backup = JSON.parse(backupData);
      
      // Check backup age and warn if it's old
      if (backup.timestamp) {
        const backupAge = Date.now() - new Date(backup.timestamp).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        if (backupAge > thirtyDays) {
          console.warn(`Backup is ${Math.round(backupAge / (24 * 60 * 60 * 1000))} days old - consider creating a fresh backup`);
        }
      }

      // Validate backup version compatibility
      if (backup.version && backup.version !== '1.0.0') {
        console.warn(`Backup version ${backup.version} may not be compatible with current version 1.0.0`);
      }

      console.log(`Restoring data from backup (${backup.timestamp || 'unknown date'})...`);

      // Restore data in the correct order (respecting foreign key constraints)
      if (backup.user) {
        await this.db!.runAsync(
          'INSERT OR REPLACE INTO users (id, name, has_completed_onboarding, setup_step, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [backup.user.id, backup.user.name, backup.user.has_completed_onboarding, backup.user.setup_step, backup.user.created_at, backup.user.updated_at]
        );
      }

      if (backup.supportPerson) {
        await this.db!.runAsync(
          'INSERT OR REPLACE INTO support_persons (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [backup.supportPerson.id, backup.supportPerson.name, backup.supportPerson.phone, backup.supportPerson.created_at, backup.supportPerson.updated_at]
        );
      }

      if (backup.sobrietyData && backup.sobrietyData.length > 0) {
        for (const data of backup.sobrietyData) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO sobriety_data (id, tracking_sobriety, tracking_mode, sober_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [data.id, data.tracking_sobriety, data.tracking_mode || 'sober', data.sober_date, data.created_at, data.updated_at]
          );
        }
      }

      if (backup.userReasons && backup.userReasons.length > 0) {
        for (const reason of backup.userReasons) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO user_reasons (id, reason, created_at) VALUES (?, ?, ?)',
            [reason.id, reason.reason, reason.created_at]
          );
        }
      }

      if (backup.journalEntries && backup.journalEntries.length > 0) {
        for (const entry of backup.journalEntries) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO journal_entries (id, content, timestamp, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [entry.id, entry.content, entry.timestamp, entry.created_at, entry.updated_at || entry.created_at]
          );
        }
      }

      if (backup.intentions && backup.intentions.length > 0) {
        for (const intention of backup.intentions) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO intentions (id, content, timestamp, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [intention.id, intention.content, intention.timestamp, intention.created_at, intention.updated_at || intention.created_at]
          );
        }
      }

      if (backup.dailyCheckIns && backup.dailyCheckIns.length > 0) {
        for (const checkIn of backup.dailyCheckIns) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO daily_check_ins (id, goal, energy, tone, thankful, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [checkIn.id, checkIn.goal, checkIn.energy, checkIn.tone, checkIn.thankful, checkIn.date, checkIn.created_at]
          );
        }
      }

      if (backup.sosLogs && backup.sosLogs.length > 0) {
        for (const log of backup.sosLogs) {
          await this.db!.runAsync(
            'INSERT OR REPLACE INTO sos_logs (id, timestamp, created_at) VALUES (?, ?, ?)',
            [log.id, log.timestamp, log.created_at]
          );
        }
      }

      // console.log('Data restored successfully from backup');
    } catch (error) {
      // console.error('Error restoring data:', error);
    }
  }

  // Manual backup trigger for testing
  async manualBackup(): Promise<void> {
    try {
      await this.backupData();
      // console.log('Manual backup completed successfully');
    } catch (error) {
      // console.error('Manual backup failed:', error);
      throw error;
    }
  }

  // Manual restore trigger for testing
  async manualRestore(): Promise<void> {
    try {
      await this.restoreDataIfNeeded();
      // console.log('Manual restore completed successfully');
    } catch (error) {
      // console.error('Manual restore failed:', error);
      throw error;
    }
  }

  // Get backup status information
  async getBackupStatus(): Promise<{ exists: boolean; timestamp?: string; age?: number; size?: number }> {
    try {
      const backupData = await AsyncStorage.getItem('sober_balance_backup');
      if (!backupData) {
        return { exists: false };
      }

      const backup = JSON.parse(backupData);
      const backupSize = backupData.length;
      const timestamp = backup.timestamp;
      const age = timestamp ? Math.round((Date.now() - new Date(timestamp).getTime()) / (24 * 60 * 60 * 1000)) : undefined;

      return {
        exists: true,
        timestamp,
        age,
        size: Math.round(backupSize / 1024) // Size in KB
      };
    } catch (error) {
      console.error('Error getting backup status:', error);
      return { exists: false };
    }
  }
}

// Export singleton instance
export const database = new DatabaseService(); 