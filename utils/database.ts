import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

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
}

export interface Intention {
  id?: number;
  content: string;
  timestamp: string;
  created_at?: string;
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

  async init(): Promise<void> {
    try {
      // Close existing database connection if any
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (error) {
          console.warn('Error closing existing database:', error);
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
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
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
          console.log('Migrating daily_check_ins table to remove feeling column...');
          
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

          console.log('Database migration completed successfully');
        }
      }
    } catch (error) {
      console.error('Error during database migration:', error);
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create intentions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS intentions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

    console.log('Tables created successfully');
  }

  private async seedEncouragements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if encouragements table is empty
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM encouragements'
    );

    if (result && result.count === 0) {
      console.log('Seeding encouragements...');
      
      // Import the seed data
      const encouragementsData = require('../seeders/encouragements_seed.json');
      
      // Insert all encouragements
      for (const encouragement of encouragementsData) {
        await this.db.runAsync(
          'INSERT INTO encouragements (message, seen) VALUES (?, ?)',
          [encouragement.message, encouragement.seen ? 1 : 0]
        );
      }
      
      console.log(`Seeded ${encouragementsData.length} encouragements`);
    }
  }

  // Encouragement methods
  async getRandomEncouragement(): Promise<Encouragement | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for encouragement:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<Encouragement>(
        'SELECT * FROM encouragements ORDER BY RANDOM() LIMIT 1'
      );
      
      return result || null;
    } catch (error) {
      console.error('Error getting random encouragement:', error);
      return null;
    }
  }

  async getRandomUnseenEncouragement(): Promise<Encouragement | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for unseen encouragement:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<Encouragement>(
        'SELECT * FROM encouragements WHERE seen = 0 ORDER BY RANDOM() LIMIT 1'
      );
      
      return result || null;
    } catch (error) {
      console.error('Error getting random encouragement:', error);
      return null;
    }
  }

  async markEncouragementAsSeen(id: number): Promise<void> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for marking encouragement:', error);
        return;
      }
    }

    try {
      await this.db!.runAsync(
        'UPDATE encouragements SET seen = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error marking encouragement as seen:', error);
      throw error;
    }
  }

  async resetAllEncouragements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE encouragements SET seen = 0, updated_at = CURRENT_TIMESTAMP'
      );
      console.log('All encouragements reset');
    } catch (error) {
      console.error('Error resetting encouragements:', error);
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
      console.error('Error getting encouragement stats:', error);
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
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(): Promise<User | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for user:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<User>(
        'SELECT * FROM users ORDER BY id DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      console.error('Error getting user:', error);
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
    } catch (error) {
      console.error('Error updating user onboarding:', error);
      throw error;
    }
  }

  // Support person methods
  async saveSupportPerson(name: string, phone: string): Promise<number> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for support person:', error);
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
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving support person:', error);
      throw error;
    }
  }

  async getSupportPerson(): Promise<SupportPerson | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for support person:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<SupportPerson>(
        'SELECT * FROM support_persons ORDER BY id DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      console.error('Error getting support person:', error);
      return null;
    }
  }

  // Sobriety data methods
  async saveSobrietyData(trackingSobriety: boolean, soberDate?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Clear existing sobriety data first
      await this.db.runAsync('DELETE FROM sobriety_data');
      
      const result = await this.db.runAsync(
        'INSERT INTO sobriety_data (tracking_sobriety, sober_date) VALUES (?, ?)',
        [trackingSobriety ? 1 : 0, soberDate || null]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error saving sobriety data:', error);
      throw error;
    }
  }

  async getSobrietyData(): Promise<SobrietyData | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for sobriety data:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<SobrietyData>(
        'SELECT * FROM sobriety_data ORDER BY id DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      console.error('Error getting sobriety data:', error);
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
    } catch (error) {
      console.error('Error saving user reasons:', error);
      throw error;
    }
  }

  // SOS logging methods
  async logSOSActivation(timestamp: string): Promise<number> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for SOS logging:', error);
        return 0;
      }
    }

    try {
      const result = await this.db!.runAsync(
        'INSERT INTO sos_logs (timestamp) VALUES (?)',
        [timestamp]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error logging SOS activation:', error);
      return 0;
    }
  }

  async getSOSLogs(): Promise<{ id: number; timestamp: string }[]> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for SOS logs:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<{ id: number; timestamp: string }>(
        'SELECT id, timestamp FROM sos_logs ORDER BY timestamp DESC LIMIT 50'
      );
      return results;
    } catch (error) {
      console.error('Error getting SOS logs:', error);
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
      console.error('Error getting user reasons:', error);
      return [];
    }
  }

  // Journal methods
  async createJournalEntry(content: string): Promise<number> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for journal entry:', error);
        return 0;
      }
    }

    try {
      const timestamp = new Date().toISOString();
      const result = await this.db!.runAsync(
        'INSERT INTO journal_entries (content, timestamp) VALUES (?, ?)',
        [content, timestamp]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return 0;
    }
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for journal entries:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<JournalEntry>(
        'SELECT * FROM journal_entries ORDER BY timestamp DESC'
      );
      return results;
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for journal entry:', error);
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
      console.error('Error getting journal entry:', error);
      return null;
    }
  }

  // Intention methods
  async createIntention(content: string): Promise<number> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for intention:', error);
        return 0;
      }
    }

    try {
      const timestamp = new Date().toISOString();
      const result = await this.db!.runAsync(
        'INSERT INTO intentions (content, timestamp) VALUES (?, ?)',
        [content, timestamp]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating intention:', error);
      return 0;
    }
  }

  async getIntentions(): Promise<Intention[]> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for intentions:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<Intention>(
        'SELECT * FROM intentions ORDER BY timestamp DESC'
      );
      return results;
    } catch (error) {
      console.error('Error getting intentions:', error);
      return [];
    }
  }

  async getCurrentIntention(): Promise<Intention | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for current intention:', error);
        return null;
      }
    }

    try {
      const result = await this.db!.getFirstAsync<Intention>(
        'SELECT * FROM intentions ORDER BY timestamp DESC LIMIT 1'
      );
      return result || null;
    } catch (error) {
      console.error('Error getting current intention:', error);
      return null;
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
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for daily check-in:', error);
        return 0;
      }
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const result = await this.db!.runAsync(
        'INSERT INTO daily_check_ins (goal, energy, tone, thankful, date) VALUES (?, ?, ?, ?, ?)',
        [goal, energy, tone, thankful, today]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating daily check-in:', error);
      return 0;
    }
  }

  async getTodayCheckIn(): Promise<DailyCheckIn | null> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for today check-in:', error);
        return null;
      }
    }

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const result = await this.db!.getFirstAsync<DailyCheckIn>(
        'SELECT * FROM daily_check_ins WHERE date = ?',
        [today]
      );
      return result || null;
    } catch (error) {
      console.error('Error getting today check-in:', error);
      return null;
    }
  }

  async getCheckInHistory(): Promise<DailyCheckIn[]> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for check-in history:', error);
        return [];
      }
    }

    try {
      const results = await this.db!.getAllAsync<DailyCheckIn>(
        'SELECT * FROM daily_check_ins ORDER BY date DESC LIMIT 30'
      );
      return results;
    } catch (error) {
      console.error('Error getting check-in history:', error);
      return [];
    }
  }

  // Debug methods
  async debugLogAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('=== Database Debug Info ===');
      
      const user = await this.getUser();
      console.log('User:', user);
      
      const supportPerson = await this.getSupportPerson();
      console.log('Support Person:', supportPerson);
      
      const sobrietyData = await this.getSobrietyData();
      console.log('Sobriety Data:', sobrietyData);
      
      const userReasons = await this.getUserReasons();
      console.log('User Reasons:', userReasons);
      
      const encouragementStats = await this.getEncouragementStats();
      console.log('Encouragement Stats:', encouragementStats);
      
      const journalEntries = await this.getJournalEntries();
      console.log('Journal Entries:', journalEntries.length);
      
      const intentions = await this.getIntentions();
      console.log('Intentions:', intentions.length);
      
      const checkIns = await this.getCheckInHistory();
      console.log('Daily Check-ins:', checkIns.length);
      
      console.log('===========================');
    } catch (error) {
      console.error('Error logging database data:', error);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for clearing data:', error);
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
      
      console.log('All data cleared');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  async clearUserData(): Promise<void> {
    if (!this.db) {
      console.warn('Database not initialized, attempting to initialize...');
      try {
        await this.init();
      } catch (error) {
        console.error('Failed to initialize database for clearing user data:', error);
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
      
      console.log('User data cleared, encouragements preserved');
    } catch (error) {
      console.error('Error clearing user data:', error);
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
          console.warn('Error closing database:', error);
        }
      }
      
      this.db = null;
      
      // Reinitialize database
      await this.init();
      
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const database = new DatabaseService(); 