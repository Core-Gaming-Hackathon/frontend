// import { createClient } from '@supabase/supabase-js';
// import { Database } from './types';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// // Utility functions for common operations
// export const getProfile = async (userId: string) => {
//   const { data, error } = await supabase
//     .from('profiles')
//     .select('*')
//     .eq('id', userId)
//     .single();
  
//   if (error) throw error;
//   return data;
// };

// export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
//   const { data, error } = await supabase
//     .from('profiles')
//     .update(updates)
//     .eq('id', userId);
  
//   if (error) throw error;
//   return data;
// };

// export const createGameSession = async (session: Omit<GameSession, 'id' | 'created_at'>) => {
//   const { data, error } = await supabase
//     .from('game_sessions')
//     .insert(session)
//     .select()
//     .single();
  
//   if (error) throw error;
//   return data;
// };

// export const syncPrediction = async (prediction: Omit<Prediction, 'created_at'>) => {
//   const { data, error } = await supabase
//     .from('predictions')
//     .upsert(prediction, { onConflict: 'id' })
//     .select()
//     .single();
  
//   if (error) throw error;
//   return data;
// };

// export const syncUserBet = async (bet: Omit<UserBet, 'id' | 'created_at'>) => {
//   const { data, error } = await supabase
//     .from('user_bets')
//     .insert(bet)
//     .select()
//     .single();
  
//   if (error) throw error;
//   return data;
// };