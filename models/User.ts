import { dbConnect } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export type UserRole = "user" | "admin" | "agency";

export interface IUser {
  _id?: ObjectId;
  email: string;
  name?: string;
  image?: string;
  password?: string; // Hashed password for email/password auth
  googleId?: string; // Optional for email/password users
  role: UserRole; // User role for access control
  agencyId?: ObjectId; // Reference to agency if role is "agency"
  favorites: string[]; // Array of listing IDs
  emailVerified?: Date;
  mustChangePassword?: boolean; // Force password change on first login
  // Email preferences
  emailPreferences?: {
    alerts: boolean; // Receive listing alerts
    newsletter: boolean; // Receive newsletter
    marketing: boolean; // Receive marketing emails
    messages: boolean; // Receive email notifications for new messages (default: true)
  };
  // UI preferences
  darkMode?: boolean; // Dark mode preference
  createdAt: Date;
  updatedAt: Date;
}

// Track if indexes have been initialized
let indexesInitialized = false;

export async function getUserModel() {
  const db = await dbConnect();
  const collection = db.collection<IUser>("users");

  // Only create indexes once per server lifecycle
  if (!indexesInitialized) {
    try {
      // Create email index
      await collection.createIndex({ email: 1 }, { unique: true });

      // Create googleId index with sparse option
      // Using createIndexes to avoid conflicts
      const existingIndexes = await collection.indexes();
      const googleIdIndex = existingIndexes.find(
        (idx) => idx.name === "googleId_1"
      );

      // If old index exists without sparse, we need to handle it manually
      // For now, just try to create with sparse - if it fails, the old one will be used
      if (!googleIdIndex) {
        await collection.createIndex(
          { googleId: 1 },
          { unique: true, sparse: true }
        );
      }

      indexesInitialized = true;
    } catch (error: any) {
      // Ignore duplicate index errors
      if (error.code !== 85 && error.code !== 86 && error.code !== 276) {
        console.error("Error creating indexes:", error);
      }
      indexesInitialized = true; // Don't retry on error
    }
  }

  return collection;
}

export async function findOrCreateUser(profile: {
  email: string;
  name?: string;
  image?: string;
  googleId: string;
}): Promise<{ user: IUser; isNewUser: boolean }> {
  const User = await getUserModel();

  const existingUser = await User.findOne({ googleId: profile.googleId });

  if (existingUser) {
    // Update user info if changed
    await User.updateOne(
      { googleId: profile.googleId },
      {
        $set: {
          name: profile.name,
          image: profile.image,
          updatedAt: new Date(),
        },
      }
    );
    return {
      user: { ...existingUser, name: profile.name, image: profile.image },
      isNewUser: false,
    };
  }

  // Create new user
  const newUser: IUser = {
    email: profile.email,
    name: profile.name,
    image: profile.image,
    googleId: profile.googleId,
    role: "user",
    favorites: [],
    emailPreferences: {
      alerts: true,
      newsletter: true,
      marketing: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await User.insertOne(newUser);
  return {
    user: { ...newUser, _id: result.insertedId },
    isNewUser: true,
  };
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
  const User = await getUserModel();
  return User.findOne({ email });
}

export async function getUserById(id: string): Promise<IUser | null> {
  const User = await getUserModel();
  return User.findOne({ _id: new ObjectId(id) });
}

export async function addFavorite(
  userId: string,
  listingId: string
): Promise<boolean> {
  const User = await getUserModel();
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    {
      $addToSet: { favorites: listingId },
      $set: { updatedAt: new Date() },
    }
  );
  return result.modifiedCount > 0;
}

export async function removeFavorite(
  userId: string,
  listingId: string
): Promise<boolean> {
  const User = await getUserModel();
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: { favorites: listingId },
      $set: { updatedAt: new Date() },
    }
  );
  return result.modifiedCount > 0;
}

export async function getUserFavorites(userId: string): Promise<string[]> {
  const user = await getUserById(userId);
  return user?.favorites || [];
}

// Email/Password Authentication Functions
export async function createUserWithPassword(data: {
  email: string;
  password: string;
  name: string;
  mustChangePassword?: boolean;
}): Promise<{ success: boolean; error?: string; user?: IUser }> {
  const User = await getUserModel();

  // Check if user already exists
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    return { success: false, error: "Un compte existe déjà avec cet email" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create user
  const newUser: IUser = {
    email: data.email.toLowerCase(),
    name: data.name,
    password: hashedPassword,
    role: "user",
    favorites: [],
    mustChangePassword: data.mustChangePassword || false,
    emailPreferences: {
      alerts: true,
      newsletter: true,
      marketing: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await User.insertOne(newUser);
  return { success: true, user: { ...newUser, _id: result.insertedId } };
}

export async function verifyPassword(
  email: string,
  password: string
): Promise<IUser | null> {
  const User = await getUserModel();
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  return user;
}

// Admin Functions
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === "admin";
}

export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ users: IUser[]; total: number; pages: number }> {
  const User = await getUserModel();

  const query: any = {};
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);
  const pages = Math.ceil(total / limit);

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .project({ password: 0 }) // Exclude password
    .toArray();

  return { users: users as IUser[], total, pages };
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<boolean> {
  const User = await getUserModel();
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function updateUserPassword(
  userId: string,
  newPassword: string,
  clearMustChangePassword: boolean = false
): Promise<boolean> {
  const User = await getUserModel();
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  const update: any = {
    $set: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  };
  
  if (clearMustChangePassword) {
    update.$set.mustChangePassword = false;
  }
  
  const result = await User.updateOne(
    { _id: new ObjectId(userId) },
    update
  );
  return result.modifiedCount > 0;
}

export async function deleteUser(userId: string): Promise<boolean> {
  const User = await getUserModel();
  const result = await User.deleteOne({ _id: new ObjectId(userId) });
  return result.deletedCount > 0;
}

export async function getUserStats(): Promise<{
  total: number;
  admins: number;
  thisMonth: number;
  thisWeek: number;
}> {
  const User = await getUserModel();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [total, admins, thisMonth, thisWeek] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
  ]);

  return { total, admins, thisMonth, thisWeek };
}
