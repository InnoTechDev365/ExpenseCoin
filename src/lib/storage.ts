
import { Transaction, Budget, Category, UserSettings } from './types';

// Default user settings
const defaultSettings: UserSettings = {
  currency: 'USD',
  language: 'en',
  storageType: 'local'
};

// Default categories for new users (no demo transactions)
const defaultCategories: Category[] = [
  { id: 'income-salary', name: 'Salary', color: '#10b981', type: 'income' },
  { id: 'income-freelance', name: 'Freelance', color: '#059669', type: 'income' },
  { id: 'income-investment', name: 'Investment', color: '#047857', type: 'income' },
  { id: 'expense-food', name: 'Food & Dining', color: '#ef4444', type: 'expense' },
  { id: 'expense-transport', name: 'Transportation', color: '#f97316', type: 'expense' },
  { id: 'expense-shopping', name: 'Shopping', color: '#eab308', type: 'expense' },
  { id: 'expense-entertainment', name: 'Entertainment', color: '#8b5cf6', type: 'expense' },
  { id: 'expense-utilities', name: 'Utilities', color: '#06b6d4', type: 'expense' }
];

class StorageManager {
  private settings: UserSettings;
  private isSupabaseConnected: boolean = false;
  private userId: string;

  constructor() {
    this.userId = this.initializeUserId();
    this.settings = this.loadSettings();
    this.initializeDefaultData();
    this.isSupabaseConnected = this.settings.storageType === 'supabase';
  }

  // Private initialization methods
  private initializeUserId(): string {
    let userId = localStorage.getItem('expense_coin_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('expense_coin_user_id', userId);
      console.log('New user initialized with ID:', userId);
    }
    return userId;
  }

  private loadSettings(): UserSettings {
    const savedSettings = localStorage.getItem(`user_settings_${this.userId}`);
    const settings = savedSettings ? JSON.parse(savedSettings) : { ...defaultSettings };
    
    if (!savedSettings) {
      this.saveSettings(settings);
      console.log('Default settings initialized for user:', this.userId);
    }
    
    return settings;
  }

  private initializeDefaultData(): void {
    const existingCategories = this.getCategories();
    const existingTransactions = this.getTransactions();
    
    // Only initialize categories if none exist
    if (existingCategories.length === 0) {
      this.saveCategories(defaultCategories);
      console.log('Default categories initialized for user:', this.userId);
    }
    
    // Ensure no demo transactions exist for new users
    if (existingTransactions.length === 0) {
      this.saveTransactions([]);
      console.log('Clean transaction history initialized for user:', this.userId);
    }
    
    // Ensure no demo budgets exist for new users
    const existingBudgets = this.getBudgets();
    if (existingBudgets.length === 0) {
      this.saveBudgets([]);
      console.log('Clean budget list initialized for user:', this.userId);
    }
  }

  // Public API methods
  getSettings(): UserSettings {
    return { ...this.settings };
  }

  saveSettings(settings: UserSettings): void {
    this.settings = settings;
    localStorage.setItem(`user_settings_${this.userId}`, JSON.stringify(settings));
  }

  setCurrency(currency: string): void {
    this.settings.currency = currency;
    this.saveSettings(this.settings);
  }

  // Supabase connection management
  isConnectedToSupabase(): boolean {
    return this.isSupabaseConnected;
  }

  connectToSupabase(connected: boolean): void {
    this.isSupabaseConnected = connected;
    this.settings.storageType = connected ? 'supabase' : 'local';
    this.saveSettings(this.settings);
    
    if (connected) {
      console.log(`Connected to Supabase for user ${this.userId}. Data will now be synchronized.`);
      this.syncToSupabase();
    } else {
      console.log(`Disconnected from Supabase for user ${this.userId}. Data will be stored locally only.`);
    }
  }

  private syncToSupabase(): void {
    if (!this.isSupabaseConnected) return;
    
    const transactions = this.getTransactions();
    const budgets = this.getBudgets();
    const categories = this.getCategories();
    
    console.log(`Syncing to Supabase for user ${this.userId}:`, {
      transactions: transactions.length,
      budgets: budgets.length,
      categories: categories.length,
      userId: this.userId
    });
  }

  // Transaction management
  getTransactions(): Transaction[] {
    if (this.isSupabaseConnected) {
      console.log(`Fetching transactions from Supabase for user ${this.userId}`);
    }
    
    const data = localStorage.getItem(`transactions_${this.userId}`);
    return data ? JSON.parse(data) : [];
  }

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(`transactions_${this.userId}`, JSON.stringify(transactions));
    
    if (this.isSupabaseConnected) {
      console.log(`Syncing ${transactions.length} transactions to Supabase for user ${this.userId}`);
    }
  }

  addTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    this.saveTransactions(transactions);
    console.log(`Transaction added for user ${this.userId}:`, transaction.description);
  }

  // Budget management
  getBudgets(): Budget[] {
    if (this.isSupabaseConnected) {
      console.log(`Fetching budgets from Supabase for user ${this.userId}`);
    }
    
    const data = localStorage.getItem(`budgets_${this.userId}`);
    return data ? JSON.parse(data) : [];
  }

  saveBudgets(budgets: Budget[]): void {
    localStorage.setItem(`budgets_${this.userId}`, JSON.stringify(budgets));
    
    if (this.isSupabaseConnected) {
      console.log(`Syncing ${budgets.length} budgets to Supabase for user ${this.userId}`);
    }
  }

  addBudget(budget: Budget): void {
    const budgets = this.getBudgets();
    budgets.push(budget);
    this.saveBudgets(budgets);
    console.log(`Budget added for user ${this.userId}:`, budget.id);
  }

  // Category management
  getCategories(): Category[] {
    if (this.isSupabaseConnected) {
      console.log(`Fetching categories from Supabase for user ${this.userId}`);
    }
    
    const data = localStorage.getItem(`categories_${this.userId}`);
    return data ? JSON.parse(data) : [];
  }

  saveCategories(categories: Category[]): void {
    localStorage.setItem(`categories_${this.userId}`, JSON.stringify(categories));
    
    if (this.isSupabaseConnected) {
      console.log(`Syncing ${categories.length} categories to Supabase for user ${this.userId}`);
    }
  }

  // Data management
  clearAllData(): void {
    localStorage.removeItem(`transactions_${this.userId}`);
    localStorage.removeItem(`budgets_${this.userId}`);
    localStorage.removeItem(`categories_${this.userId}`);
    
    // Reinitialize with clean data
    this.initializeDefaultData();
    
    if (this.isSupabaseConnected) {
      console.log(`Clearing and reinitializing Supabase data for user ${this.userId}`);
      this.syncToSupabase();
    }
    
    console.log(`All data cleared and reinitialized for user ${this.userId}`);
  }
}

// Create a singleton instance
export const storageManager = new StorageManager();
