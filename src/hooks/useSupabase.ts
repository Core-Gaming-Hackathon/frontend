// import { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabase/client';
// import type { Profile, GameSession, Prediction } from '@/lib/supabase/types';

// export function useProfile(userId: string | null) {
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!userId) return;

//     const fetchProfile = async () => {
//       try {
//         const { data } = await supabase
//           .from('profiles')
//           .select('*')
//           .eq('id', userId)
//           .single();
//         setProfile(data);
//       } catch (error) {
//         console.error('Error fetching profile:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [userId]);

//   return { profile, loading };
// }

// export function useGameSessions(userId: string | null) {
//   const [sessions, setSessions] = useState<GameSession[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!userId) return;

//     const fetchSessions = async () => {
//       try {
//         const { data } = await supabase
//           .from('game_sessions')
//           .select('*')
//           .eq('player_id', userId)
//           .order('created_at', { ascending: false });
//         setSessions(data || []);
//       } catch (error) {
//         console.error('Error fetching game sessions:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSessions();

//     // Subscribe to changes
//     const subscription = supabase
//       .channel('game_sessions_changes')
//       .on('postgres_changes', 
//         { event: '*', schema: 'public', table: 'game_sessions', filter: `player_id=eq.${userId}` },
//         () => {
//           fetchSessions();
//         }
//       )
//       .subscribe();

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, [userId]);

//   return { sessions, loading };
// }

// export function usePredictions(chainId: number) {
//   const [predictions, setPredictions] = useState<Prediction[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchPredictions = async () => {
//       try {
//         const { data } = await supabase
//           .from('predictions')
//           .select('*')
//           .eq('chain_id', chainId)
//           .order('created_at', { ascending: false });
//         setPredictions(data || []);
//       } catch (error) {
//         console.error('Error fetching predictions:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchPredictions();

//     // Subscribe to changes
//     const subscription = supabase
//       .channel('predictions_changes')
//       .on('postgres_changes',
//         { event: '*', schema: 'public', table: 'predictions' },
//         () => {
//           fetchPredictions();
//         }
//       )
//       .subscribe();

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, [chainId]);

//   return { predictions, loading };
// }