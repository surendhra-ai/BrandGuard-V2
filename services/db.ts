import { supabase, isSupabaseConfigured } from './supabase';
import { User, LogEntry, AnalysisSession } from '../types';

// We use localStorage for session persistence
const SESSION_KEY = 'bg_current_session_user';

// --- Auth / User Management ---

export const dbRegisterUser = async (email: string, name: string): Promise<User> => {
  if (!isSupabaseConfigured) {
    console.log('[Offline] Registering user locally');
    const user: User = {
      id: 'offline-' + Date.now(),
      email,
      name,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  // Check if exists
  const { data: existing } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    throw new Error('User already exists');
  }

  const { data, error } = await supabase
    .from('app_users')
    .insert([{ email, name }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  const user: User = {
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const dbLoginUser = async (email: string): Promise<User> => {
  if (!isSupabaseConfigured) {
    console.log('[Offline] Logging in locally');
    // Simulate login by creating a dummy user session if one doesn't exist matching the email
    // For demo purposes, we just create a session for this email
    const user: User = {
      id: 'offline-' + email.replace(/[^a-z0-9]/gi, ''),
      email,
      name: email.split('@')[0],
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  const user: User = {
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: data.created_at
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const dbLogoutUser = async () => {
  localStorage.removeItem(SESSION_KEY);
};

export const dbGetCurrentUser = async (): Promise<User | null> => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  
  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
};

// --- API Keys (Stored in User Table or LocalStorage in offline mode) ---

export const dbSaveFirecrawlKey = async (userId: string, key: string): Promise<void> => {
  if (!isSupabaseConfigured) {
    localStorage.setItem(`firecrawl_key_${userId}`, key);
    return;
  }

  const { error } = await supabase
    .from('app_users')
    .update({ firecrawl_key: key })
    .eq('id', userId);

  if (error) throw new Error(error.message);
};

export const dbGetFirecrawlKey = async (userId: string): Promise<string | null> => {
  if (!isSupabaseConfigured) {
    return localStorage.getItem(`firecrawl_key_${userId}`);
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('firecrawl_key')
    .eq('id', userId)
    .single();
    
  if (error) return null;
  return data?.firecrawl_key || null;
};

// --- Logs ---

export const dbAddLog = async (userId: string, userName: string, action: LogEntry['action'], details: string) => {
  if (!isSupabaseConfigured) {
    console.debug(`[Log - ${action}] ${details}`);
    return;
  }

  await supabase
    .from('logs')
    .insert([{ 
      user_id: userId, 
      user_name: userName, 
      action, 
      details 
    }]);
};

export const dbGetLogs = async (): Promise<LogEntry[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    userName: d.user_name,
    timestamp: d.created_at,
    action: d.action,
    details: d.details
  }));
};

// --- Analysis History ---

export const dbSaveAnalysis = async (session: Omit<AnalysisSession, 'id' | 'timestamp'>) => {
  if (!isSupabaseConfigured) {
    // In offline mode, we don't persist history to keep it simple, or could use IndexedDB
    // For now, just return a mock success
    return {
      ...session,
      id: 'offline-analysis-' + Date.now(),
      timestamp: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .insert([{
      user_id: session.userId,
      project_name: session.projectName,
      reference_url: session.referenceUrl,
      results: session.results
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    ...session,
    id: data.id,
    timestamp: data.created_at
  };
};

export const dbGetHistory = async (userId: string): Promise<AnalysisSession[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    projectName: d.project_name,
    referenceUrl: d.reference_url,
    timestamp: d.created_at,
    results: d.results
  }));
};

export const dbDeleteHistory = async (id: string) => {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const dbClearAllHistory = async (userId: string) => {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('analysis_history')
    .delete()
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};