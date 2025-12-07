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
  // New fields:
  first_time_played?: Date;
  last_time_played?: Date;
  /** Maps month string (YYYY-MM) to number of games played */
  games_per_month: Map<string, number>;
  /** Top cards used, sorted by frequency */
  top_cards_used: Array<{ card: string; count: number }>;
  /** Top responses that received likes, normalized by lobby size */
  top_liked_responses: Array<{
    response: string;
    normalized_likes: number;
    lobby_size: number;
  }>;
  /** Top players this user has played with, sorted by frequency */
  top_teammates: Array<{ uid: string; name: string; games: number }>;
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

/**
 * Calculate derived statistics like top cards, top teammates, etc.
 */
async function calculateDerivedStats(
  userStatsMap: Map<string, UserStats>,
): Promise<void> {
  // Create a map to track merged users (multiple UIDs -> same person)
  const uidToCanonicalUid = new Map<string, string>();
  for (const [uid, stats] of userStatsMap.entries()) {
    // All player refs for this user point to the same canonical UID
    for (const ref of stats.playerInLobbyRefs) {
      uidToCanonicalUid.set(ref.uid, uid);
    }
  }

  // Helper to get canonical UID (handles merged users)
  const getCanonicalUid = (uid: string): string => {
    return uidToCanonicalUid.get(uid) || uid;
  };

  // For each user, calculate their detailed stats
  for (const [uid, userStat] of userStatsMap.entries()) {
    const allPlayerUids = new Set(userStat.playerInLobbyRefs.map((p) => p.uid));

    // Track cards used by this user
    const cardUsage = new Map<string, number>();
    // Track responses with their likes
    const likedResponses: Array<{
      response: string;
      normalized_likes: number;
      lobby_size: number;
    }> = [];
    // Track teammates (other players in same games)
    const teammateGames = new Map<string, { name: string; count: number }>();

    // Process each game this user played
    for (const lobby of userStat.games) {
      const lobbyPlayers = await getAllPlayersInLobby(lobby.id);
      const lobbySize = lobbyPlayers.length;

      // Track all other players in this lobby (teammates)
      for (const player of lobbyPlayers) {
        const canonicalTeammateUid = getCanonicalUid(player.uid);
        // Don't count self
        if (canonicalTeammateUid === uid) continue;

        const existing = teammateGames.get(canonicalTeammateUid);
        if (existing) {
          existing.count++;
        } else {
          teammateGames.set(canonicalTeammateUid, {
            name: player.name,
            count: 1,
          });
        }
      }

      // Process each turn to find cards used and liked responses
      for (const turn of lobby.turns) {
        // Find this user's response in this turn
        for (const [responsePlayerUid, response] of turn.player_responses) {
          // Check if this response belongs to our user (could be any of their UIDs)
          if (!allPlayerUids.has(responsePlayerUid)) continue;

          // Count cards used
          for (const card of response.cards) {
            const currentCount = cardUsage.get(card.content) || 0;
            cardUsage.set(card.content, currentCount + 1);
          }

          // Track liked responses (normalize by lobby size)
          if (response.like_count && response.like_count > 0) {
            const normalizedLikes =
              lobbySize > 1 ? response.like_count / (lobbySize - 1) : 0;
            likedResponses.push({
              response: response.cards.map((c) => c.content).join(' / '),
              normalized_likes: normalizedLikes,
              lobby_size: lobbySize,
            });
          }
        }
      }
    }

    // Sort and take top 5 cards
    userStat.top_cards_used = Array.from(cardUsage.entries())
      .map(([card, count]) => ({ card, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort and take top 5 liked responses
    userStat.top_liked_responses = likedResponses
      .sort((a, b) => b.normalized_likes - a.normalized_likes)
      .slice(0, 5);

    // Sort and take top 5 teammates
    userStat.top_teammates = Array.from(teammateGames.entries())
      .map(([teammateUid, data]) => ({
        uid: teammateUid,
        name: data.name,
        games: data.count,
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);
  }
}

export interface FetchProgressInfo {
  current: number;
  total: number;
  percentage: number;
}

export type YearFilter = number | 'all';

export interface YearlyGameData {
  year: YearFilter;
  lobbies: GameLobby[];
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
 * Groups lobbies by year and returns available years.
 */
export function getAvailableYears(lobbies: GameLobby[]): number[] {
  const years = new Set<number>();
  for (const lobby of lobbies) {
    if (lobby.time_created) {
      years.add(lobby.time_created.getFullYear());
    }
  }
  return Array.from(years).sort((a, b) => b - a); // Most recent first
}

/**
 * Filters lobbies by year.
 */
export function filterLobbiesByYear(
  lobbies: GameLobby[],
  year: YearFilter,
): GameLobby[] {
  if (year === 'all') {
    return lobbies;
  }
  return lobbies.filter((lobby) => {
    if (!lobby.time_created) return false;
    return lobby.time_created.getFullYear() === year;
  });
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

    const lobbyTime = lobby.time_created || new Date();
    const monthKey = `${lobbyTime.getFullYear()}-${String(
      lobbyTime.getMonth() + 1,
    ).padStart(2, '0')}`;

    // Process each player
    for (const player of players) {
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
          total_turns_played: 0,
          total_games: 0,
          total_wins: 0,
          total_likes_received: 0,
          total_score: 0,
          total_discards: 0,
          average_score_per_game: 0,
          win_rate: 0,
          games: new Set<GameLobby>(),
          games_per_month: new Map<string, number>(),
          top_cards_used: [],
          top_liked_responses: [],
          top_teammates: [],
        };
        userStatsMap.set(player.uid, userStat);
      }
      userStat.playerInLobbyRefs.push(player);
      userStat.total_turns_played += turnsCount;
      userStat.games.add(lobby);

      // Track time played
      if (
        !userStat.first_time_played ||
        lobbyTime < userStat.first_time_played
      ) {
        userStat.first_time_played = lobbyTime;
      }
      if (!userStat.last_time_played || lobbyTime > userStat.last_time_played) {
        userStat.last_time_played = lobbyTime;
      }

      // Track games per month
      const currentMonthCount = userStat.games_per_month.get(monthKey) || 0;
      userStat.games_per_month.set(monthKey, currentMonthCount + 1);

      // Accumulate stats
      userStat.total_wins += state.wins;
      userStat.total_likes_received += state.likes;
      userStat.total_score += state.score;
      userStat.total_discards += state.discards_used;
    }
  }

  // Calculate derived stats and top items for each user
  await calculateDerivedStats(userStatsMap);

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
  const mergedGamesPerMonth = new Map<string, number>();
  let totalTurnsPlayed = 0;
  let totalWins = 0;
  let totalLikes = 0;
  let totalScore = 0;
  let totalDiscards = 0;
  let isBot = false;
  let firstTime: Date | undefined = undefined;
  let lastTime: Date | undefined = undefined;

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

    // Track first/last time
    if (user.first_time_played) {
      if (!firstTime || user.first_time_played < firstTime) {
        firstTime = user.first_time_played;
      }
    }
    if (user.last_time_played) {
      if (!lastTime || user.last_time_played > lastTime) {
        lastTime = user.last_time_played;
      }
    }

    // Merge games per month
    for (const [month, count] of user.games_per_month.entries()) {
      const currentCount = mergedGamesPerMonth.get(month) || 0;
      mergedGamesPerMonth.set(month, currentCount + count);
    }
  }

  const totalGames = mergedGames.size;

  // For the merged user, we need to recalculate top cards, responses, and teammates
  // by treating all the merged UIDs as the same person
  const merged: UserStats = {
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
    first_time_played: firstTime,
    last_time_played: lastTime,
    games_per_month: mergedGamesPerMonth,
    top_cards_used: [],
    top_liked_responses: [],
    top_teammates: [],
  };

  return merged;
}

/**
 * Recalculates derived statistics for a merged user.
 * This should be called after merging users to properly calculate top cards, teammates, etc.
 */
export async function recalculateDerivedStats(
  userStats: UserStats,
  allStats: UserStats[],
): Promise<void> {
  const userStatsMap = new Map<string, UserStats>();
  for (const stat of allStats) {
    userStatsMap.set(stat.uid, stat);
  }
  await calculateDerivedStats(userStatsMap);
}
