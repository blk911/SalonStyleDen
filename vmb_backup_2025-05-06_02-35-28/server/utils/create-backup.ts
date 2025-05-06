/**
 * Create Backup Utility
 * 
 * Provides functions to create a timestamped backup of the codebase
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Creates a backup with a specific timestamp
 * @param timestamp The timestamp to use for the backup folder name
 * @returns Promise with the result of the backup operation
 */
export async function createTimestampedBackup(timestamp: string): Promise<string> {
  try {
    // Normalize timestamp format (replace any illegal chars)
    const normalizedTimestamp = timestamp.replace(/[^\w\-]|_/g, '-');
    
    // Create backup directory name
    const backupDir = `vmb_backup_${normalizedTimestamp}`;
    const basePath = process.cwd();
    
    // Check for existing backup directory
    if (fs.existsSync(path.join(basePath, backupDir))) {
      return `Backup directory ${backupDir} already exists`;
    }
    
    // Create backup directory
    fs.mkdirSync(path.join(basePath, backupDir), { recursive: true });
    
    // Execute backup command
    const { stdout, stderr } = await execAsync(`
      cp -r client server shared package.json tsconfig.json ${backupDir}/
    `);
    
    // Update latest backup reference
    fs.writeFileSync('.vmb_latest_backup', backupDir);
    
    return `Backup created successfully: ${backupDir}`;
  } catch (error) {
    console.error('Error creating backup:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    } else {
      throw new Error('Failed to create backup: Unknown error');
    }
  }
}

export default createTimestampedBackup;