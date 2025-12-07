import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import { lobbyConverter } from '../shared/firestore-converters';
import { GameLobby, PlayerInLobby } from '../shared/types';
import {
  getAllPlayersInLobby,
  getAllPlayersStates,
} from './lobby/lobby-player-api';
import { getAllTurns } from './turn/turn-repository';
import { getAllPlayerResponses } from './turn/turn-response-api';

///////////////////////////////////////////////////////////////////////////////
//
//  This module contains methods to fetch statistics about users and games.
//
///////////////////////////////////////////////////////////////////////////////

export interface UserStats {
  uid: string;
  name: string; // the last known name
  playerInLobbyRefs: PlayerInLobby[];
  is_bot: boolean;
  total_games: number;
  total_turns_played: number;
  total_wins: number;
  total_likes_received: number;
  total_score: number;
  total_discards: number;
  average_score_per_game: number;
  win_rate: number; // wins per turn
  // To track unique games played
  games: Set<GameLobby>;
}

const lobbiesRef = collection(firestore, 'lobbies').withConverter(
  lobbyConverter,
);

/** Fetches all lobbies that have at least one turn (meaning a game was played) */
async function getPlayedLobbies(): Promise<GameLobby[]> {
  const lobbiesQuery = query(lobbiesRef, where('status', '==', 'ended'));
  return (await getDocs(lobbiesQuery)).docs.map((doc) => doc.data());
}

function countResponsesByPlayerInLobby(
  lobby: GameLobby,
  playerID: string,
): number {
  let count = 0;
  for (const turn of lobby.turns) {
    if (turn.player_responses && turn.player_responses.has(playerID)) {
      count++;
    }
  }
  return count;
}

export interface FetchProgressInfo {
  current: number;
  total: number;
  percentage: number;
}

/**
 * Fetches and enriches all lobby data including turns and player responses.
 * Returns only valid lobbies (non-test, with > 1 turn).
 */
export async function fetchAllLobbyData(
  onProgress?: (progress: FetchProgressInfo) => void,
): Promise<GameLobby[]> {
  // Fetch all played lobbies
  const lobbies = await getPlayedLobbies();

  // Filter out test lobbies
  const nonTestLobbies = lobbies.filter(
    (lobby) => !lobby.settings.freeze_stats,
  );

  // Deep-fetch lobbies, and responses in turns.
  // Filter lobbies with > 1 turns
  const validLobbies = new Array<GameLobby>();
  let processedCount = 0;
  const totalLobbies = nonTestLobbies.length;
  
  for (const lobby of nonTestLobbies) {
    lobby.turns = await getAllTurns(lobby.id);
    if (lobby.turns.length > 1) {
      validLobbies.push(lobby);
      for (const turn of lobby.turns) {
        const responses = await getAllPlayerResponses(lobby.id, turn.id);
        turn.player_responses = new Map(
          responses.map((r) => [r.player_uid, r]),
        );
      }
    }
    
    // Report progress
    processedCount++;
    if (onProgress) {
      onProgress({
        current: processedCount,
        total: totalLobbies,
        percentage: (processedCount / totalLobbies) * 100,
      });
    }
  }
  
  return validLobbies;
}

/**
 * Parses lobby data to generate user statistics.
 */
export async function parseUserStatistics(
  validLobbies: GameLobby[],
): Promise<UserStats[]> {
  // Map to accumulate stats per user
  const userStatsMap = new Map<string, UserStats>();

  // Process each lobby
  for (const lobby of validLobbies) {
    // Get players and their states
    const players = await getAllPlayersInLobby(lobby.id);
    const playerStates = await getAllPlayersStates(lobby.id);

    // Create a map of player states for quick lookup
    const statesMap = new Map(playerStates.map((s) => [s.uid, s]));

    // Process each player
    for (const player of players) {
      // Skip spectators
      // if (player.role !== 'player') continue;

      const state = statesMap.get(player.uid);
      if (!state) continue;

      const turnsCount = countResponsesByPlayerInLobby(lobby, player.uid);

      // Get or create stats entry for this user
      let userStat = userStatsMap.get(player.uid);
      if (!userStat) {
        userStat = {
          uid: player.uid,
          name: player.name,
          playerInLobbyRefs: [],
          is_bot: player.is_bot,
          total_turns_played: turnsCount,
          total_games: 0,
          total_wins: 0,
          total_likes_received: 0,
          total_score: 0,
          total_discards: 0,
          average_score_per_game: 0,
          win_rate: 0,
          // To track unique games played
          games: new Set<GameLobby>(),
        };
        userStatsMap.set(player.uid, userStat);
      }
      userStat.playerInLobbyRefs.push(player);
      userStat.total_turns_played += turnsCount;
      userStat.games.add(lobby);

      // Accumulate stats
      // Note: We can estimate turns played from the lobby's turn count
      // or from the player's actual participation
      userStat.total_wins += state.wins;
      userStat.total_likes_received += state.likes;
      userStat.total_score += state.score;
      userStat.total_discards += state.discards_used;
    }
  }

  for (const stats of userStatsMap.values()) {
    // Ensure total_games is accurate
    stats.total_games = stats.games.size;
    stats.average_score_per_game =
      stats.games.size > 0 ? stats.total_score / stats.games.size : 0;
    stats.win_rate =
      stats.total_turns_played > 0
        ? stats.total_wins / stats.total_turns_played
        : 0;
  }

  // Convert to final stats format and filter
  const stats: UserStats[] = Array.from(userStatsMap.values()).sort(
    (a, b) => b.total_games - a.total_games,
  ); // Sort by games played

  return stats;
}

/**
 * Fetches statistics for all users who have played at least one turn
 * in a non-test game.
 */
export async function fetchUserStatistics(
  onProgress?: (progress: FetchProgressInfo) => void,
): Promise<UserStats[]> {
  const validLobbies = await fetchAllLobbyData(onProgress);
  return await parseUserStatistics(validLobbies);
}

/**
 * Merges multiple user stats into a single combined user stat.
 * @param users Array of UserStats to merge
 * @param primaryUid The UID to use for the merged user (typically the first one)
 * @param primaryName The name to use for the merged user
 */
export function mergeUserStats(
  users: UserStats[],
  primaryUid: string,
  primaryName: string,
): UserStats {
  if (users.length === 0) {
    throw new Error('Cannot merge empty user list');
  }

  const mergedGames = new Set<GameLobby>();
  const mergedPlayerRefs: PlayerInLobby[] = [];
  let totalTurnsPlayed = 0;
  let totalWins = 0;
  let totalLikes = 0;
  let totalScore = 0;
  let totalDiscards = 0;
  let isBot = false;

  // Combine all stats
  for (const user of users) {
    mergedPlayerRefs.push(...user.playerInLobbyRefs);
    totalTurnsPlayed += user.total_turns_played;
    totalWins += user.total_wins;
    totalLikes += user.total_likes_received;
    totalScore += user.total_score;
    totalDiscards += user.total_discards;
    isBot = isBot || user.is_bot;
    
    // Add all games from this user
    for (const game of user.games) {
      mergedGames.add(game);
    }
  }

  const totalGames = mergedGames.size;
  
  return {
    uid: primaryUid,
    name: primaryName,
    playerInLobbyRefs: mergedPlayerRefs,
    is_bot: isBot,
    total_games: totalGames,
    total_turns_played: totalTurnsPlayed,
    total_wins: totalWins,
    total_likes_received: totalLikes,
    total_score: totalScore,
    total_discards: totalDiscards,
    average_score_per_game: totalGames > 0 ? totalScore / totalGames : 0,
    win_rate: totalTurnsPlayed > 0 ? totalWins / totalTurnsPlayed : 0,
    games: mergedGames,
  };
}
