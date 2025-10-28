import logger from '#config/logger.js';
import { db } from '#config/database.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '#models/user.model.js';

export const hashPassword  = async ( password ) => {
  try{
    return await bcrypt.hash(password, 10);
  }catch(error){
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing password');
  }
};

export const comparePassword = async ( password, hashedPassword ) => {
  try{
    return await bcrypt.compare(password, hashedPassword);
  }catch(error){
    logger.error('Error comparing password:', error);
    throw new Error('Error comparing password');
  }
};

export const createUser = async ( {name,  email, password, role = 'user'} ) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      throw new Error('User with this email already  exists');
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
    }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at });

    logger.info(`New user created with email: ${newUser.email}`);

    return newUser;
  }catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

export const authenticateUser = async ( {email, password} ) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    logger.info(`User authenticated with email: ${user.email}`);

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }catch (error) {
    logger.error('Error authenticating user:', error);
    throw error;
  }
};
