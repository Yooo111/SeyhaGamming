import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { initDatabase } from '../config/db';
import { generateAdminToken } from '../middleware/authMiddleware';

/**
 * Format and sanitize phone numbers into standard spaced pattern (e.g. 081 906 015...)
 */
const cleanPhoneNumber = (phone: string): string => {
  let digitsOnly = phone.trim().replace(/\D/g, '');
  if (digitsOnly.startsWith('855')) {
    digitsOnly = digitsOnly.slice(3);
  }
  if (!digitsOnly.startsWith('0') && digitsOnly.length >= 8) {
    digitsOnly = `0${digitsOnly}`;
  }
  if (digitsOnly.length <= 3) return digitsOnly;
  if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3)}`;
  return `${digitsOnly.slice(0, 3)} ${digitsOnly.slice(3, 6)} ${digitsOnly.slice(6)}`;
};

/**
 * Direct User Registration in MySQL
 * Checks unique phone number constraint before inserting record.
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone_number } = req.body;

    if (!name || !phone_number) {
      res.status(400).json({
        success: false,
        message: 'Name and phone number are required.',
      });
      return;
    }

    const formattedPhone = cleanPhoneNumber(phone_number);
    const pool = await initDatabase();

    // 1. Check duplicate phone number in MySQL users table (ignoring spaces)
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id, name FROM users WHERE REPLACE(phone_number, ' ', '') = REPLACE(?, ' ', '')",
      [formattedPhone]
    );

    if (existingUsers.length > 0) {
      res.status(400).json({
        success: false,
        isDuplicate: true,
        message: `The phone number (${formattedPhone}) is already registered. Only 1 account per phone number is allowed!`,
      });
      return;
    }

    // 2. Insert user into MySQL database
    const [insertResult] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (name, phone_number) VALUES (?, ?)',
      [name.trim(), formattedPhone]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Account saved in database.',
      user: {
        id: insertResult.insertId,
        name: name.trim(),
        phone_number: formattedPhone,
        created_at: new Date(),
      },
    });
  } catch (error: any) {
    console.error('Error registering user:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        success: false,
        isDuplicate: true,
        message: 'This phone number has already been registered in the database.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error completing registration. Please try again.',
      error: error.message,
    });
  }
};

/**
 * Fetch all registered users (for verification table)
 */
export const getRegisteredUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pool = await initDatabase();
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, phone_number, created_at FROM users ORDER BY created_at DESC'
    );

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('Error fetching registered users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve registered users list.',
      error: error.message,
    });
  }
};

/**
 * Admin Login Endpoint
 * Authenticates admin against admin_users table (No account creation allowed)
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
      return;
    }

    const pool = await initDatabase();
    const [admins] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, password FROM admin_users WHERE username = ?',
      [username.trim()]
    );

    if (admins.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid admin username or password.',
      });
      return;
    }

    const admin = admins[0];

    // Verify bcrypt password hash (or fallback plaintext check)
    let isPasswordValid = false;
    if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      isPasswordValid = admin.password === password;
    }

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid admin username or password.',
      });
      return;
    }

    // Generate secure admin session token
    const token = generateAdminToken(admin.id, admin.username);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error: any) {
    console.error('Error during admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login.',
      error: error.message,
    });
  }
};

/**
 * Update User (Admin Feature)
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone_number } = req.body;

    if (!name || !phone_number) {
      res.status(400).json({
        success: false,
        message: 'Name and phone number are required.',
      });
      return;
    }

    const formattedPhone = cleanPhoneNumber(phone_number);
    const pool = await initDatabase();

    // Check duplicate phone number for another user (ignoring spaces)
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE REPLACE(phone_number, ' ', '') = REPLACE(?, ' ', '') AND id != ?",
      [formattedPhone, id]
    );

    if (existing.length > 0) {
      res.status(400).json({
        success: false,
        message: `The phone number (${formattedPhone}) is already assigned to another user!`,
      });
      return;
    }

    await pool.query(
      'UPDATE users SET name = ?, phone_number = ? WHERE id = ?',
      [name.trim(), formattedPhone, id]
    );

    res.status(200).json({
      success: true,
      message: 'User record updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user record.',
      error: error.message,
    });
  }
};

/**
 * Delete User (Admin Feature)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pool = await initDatabase();

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: 'User record not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User record deleted successfully from database.',
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user record.',
      error: error.message,
    });
  }
};
