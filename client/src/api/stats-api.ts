import { lobbyConverter } from '@shared/firestore-converters';
import {
  GameLobby,
  GlobalStats,
  PlayerInLobby,
  PromptCardInGame,
  PromptCardStats,
  ResponseCardInGame,
  ResponseCardStats,
  StatsContainer,
  UserMergeMap,
  UserStats,
  YearFilter,
} from '@shared/types';
import { copyFields } from '@shared/utils';
import { saveAs } from 'file-saver';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import {
  getAllPlayersInLobby,
  getAllPlayersStates,
} from './lobby/lobby-player-api';
import { getTurnPrompt } from './turn/turn-prompt-api';
import { getAllTurns } from './turn/turn-repository';
import { getAllPlayerResponses } from './turn/turn-response-api';

///////////////////////////////////////////////////////////////////////////////
//
//  This module contains methods to fetch statistics about users and games.
//
///////////////////////////////////////////////////////////////////////////////

function copyResponseCardStats(card: ResponseCardInGame): ResponseCardStats {
  return copyFields(card, ['random_index', 'rating', 'type']);
}
function copyPromptCardStats(card: PromptCardInGame): PromptCardStats {
  return copyFields(card, ['random_index', 'rating', 'type']);
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
    for (const ref of stats.player_in_lobby_refs) {
      uidToCanonicalUid.set(ref.uid, uid);
    }
  }

  // Helper to get canonical UID (handles merged users)
  const getCanonicalUid = (uid: string): string => {
    return uidToCanonicalUid.get(uid) || uid;
  };

  // For each user, calculate their detailed stats
  for (const [uid, userStat] of userStatsMap.entries()) {
    const allPlayerUids = new Set(
      userStat.player_in_lobby_refs.map((p) => p.uid),
    );

    // Track cards used by this user (keyed by card content)
    const cardUsage = new Map<
      string,
      { card: ResponseCardStats; count: number }
    >();
    // Track responses with their likes
    const likedResponses: Array<{
      cards: ResponseCardStats[];
      normalized_likes: number;
      lobby_size: number;
    }> = [];
    // Track teammates (other players in same games)
    const teammateGames = new Map<string, { name: string; count: number }>();
    // Track prompts chosen by this user as judge (keyed by prompt content)
    const promptsChosen = new Map<
      string,
      { prompt: PromptCardStats; count: number }
    >();

    // Process each game this user played
    if (!userStat.games) continue;

    for (const lobby of userStat.games) {
      const lobbySize = lobby.players.length; // including spectators

      // Track all other players in this lobby (teammates)
      for (const player of lobby.players) {
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
        // Track prompts chosen by this user as judge
        if (
          allPlayerUids.has(turn.judge_uid) &&
          turn.prompts &&
          turn.prompts.length > 0
        ) {
          const prompt = turn.prompts[0];
          const existing = promptsChosen.get(prompt.content);
          if (existing) {
            existing.count++;
          } else {
            promptsChosen.set(prompt.content, {
              prompt: copyPromptCardStats(prompt),
              count: 1,
            });
          }
        }

        // Find this user's response in this turn
        for (const [responsePlayerUid, response] of turn.player_responses) {
          // Check if this response belongs to our user (could be any of their UIDs)
          if (!allPlayerUids.has(responsePlayerUid)) continue;

          // Count cards used
          for (const card of response.cards) {
            const existing = cardUsage.get(card.content);
            if (existing) {
              existing.count++;
              // Prefer card data when it's a non-action card (i.e. original):
              if (existing.card.action && !card.action) {
                existing.card = copyResponseCardStats(card);
              }
            } else {
              cardUsage.set(card.content, {
                card: copyResponseCardStats(card),
                count: 1,
              });
            }
          }

          // Track liked responses (normalize by lobby size)
          if (response.like_count && response.like_count > 0) {
            const normalizedLikes =
              lobbySize > 1 ? response.like_count / (lobbySize - 1) : 0;
            likedResponses.push({
              cards: response.cards.map((c) => cardUsage.get(c.content)!.card),
              normalized_likes: normalizedLikes,
              lobby_size: lobbySize,
            });
          }
        }
      }
    }

    // Sort and take top 5 cards
    userStat.top_cards_played = Array.from(cardUsage.values())
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

    // Sort and take top 5 prompts chosen
    userStat.top_prompts_played = Array.from(promptsChosen.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
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
      lobby.players = await getAllPlayersInLobby(lobby.id);
      lobby.player_states = await getAllPlayersStates(lobby.id);
      for (const turn of lobby.turns) {
        const prompt = await getTurnPrompt(lobby.id, turn);
        if (prompt) {
          turn.prompts = [prompt];
        }
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
  if (year === 'all_time') {
    return lobbies;
  }
  return lobbies.filter((lobby) => {
    if (!lobby.time_created) return false;
    return lobby.time_created.getFullYear() === year;
  });
}

/**
 * Calculates global statistics across all lobbies and players.
 */
function calculateGlobalStats(
  lobbies: GameLobby[],
  userMergeMap: UserMergeMap,
): GlobalStats {
  const promptUsage = new Map<
    string,
    { prompt: PromptCardStats; count: number }
  >();
  const responseUsage = new Map<
    string,
    { card: ResponseCardStats; count: number }
  >();
  const deckUsage = new Map<string, number>();
  const gamesPerMonth = new Map<string, number>();

  // New aggregate statistics
  let totalTurns = 0;
  let totalTimePlayed = 0;
  const uniquePlayers = new Set<string>();
  const gameDurations: number[] = [];
  const playerCounts: number[] = [];
  const turnCounts: number[] = [];

  for (const lobby of lobbies) {
    // Track games per month
    const lobbyTime = lobby.time_created || new Date();
    const monthKey = `${lobbyTime.getFullYear()}-${String(
      lobbyTime.getMonth() + 1,
    ).padStart(2, '0')}`;
    const currentMonthCount = gamesPerMonth.get(monthKey) || 0;
    gamesPerMonth.set(monthKey, currentMonthCount + 1);

    // Track decks used in this lobby
    for (const deckId of lobby.deck_ids) {
      const currentDeckCount = deckUsage.get(deckId) || 0;
      deckUsage.set(deckId, currentDeckCount + 1);
    }

    // Track total turns in this lobby
    const lobbyTurns = lobby.turns.length;
    totalTurns += lobbyTurns;
    turnCounts.push(lobbyTurns);

    // Track unique players across all lobbies (using canonical UIDs for merged users)
    const lobbyPlayers = lobby.players.length;
    for (const player of lobby.players) {
      const canonicalUid = userMergeMap.getCanonicalUid(player.uid);
      uniquePlayers.add(canonicalUid);
    }
    playerCounts.push(lobbyPlayers);

    // Calculate time played in this lobby
    if (lobby.turns.length > 0) {
      const firstTurn = lobby.turns[0];
      const lastTurn = lobby.turns[lobby.turns.length - 1];
      if (
        firstTurn.time_created &&
        (lastTurn.time_created || lastTurn.phase_end_time)
      ) {
        const endTime = lastTurn.phase_end_time ?? lastTurn.time_created;
        const gameDuration =
          endTime.getTime() - firstTurn.time_created.getTime();
        totalTimePlayed += gameDuration;
        gameDurations.push(gameDuration);
      }
    }

    // Process each turn
    for (const turn of lobby.turns) {
      // Track prompts
      if (turn.prompts && turn.prompts.length > 0) {
        const prompt = turn.prompts[0];
        const existing = promptUsage.get(prompt.content);
        if (existing) {
          existing.count++;
        } else {
          promptUsage.set(prompt.content, {
            prompt: copyPromptCardStats(prompt),
            count: 1,
          });
        }
      }

      // Track response cards played
      for (const [_, response] of turn.player_responses) {
        for (const card of response.cards) {
          const existing = responseUsage.get(card.content);
          if (existing) {
            existing.count++;
            // Prefer non-action cards
            if (existing.card.action && !card.action) {
              existing.card = copyResponseCardStats(card);
            }
          } else {
            responseUsage.set(card.content, {
              card: copyResponseCardStats(card),
              count: 1,
            });
          }
        }
      }
    }
  }

  const totalGames = lobbies.length;

  // Calculate medians
  const medianTime =
    gameDurations.length > 0
      ? gameDurations.sort((a, b) => a - b)[
          Math.floor(gameDurations.length / 2)
        ]
      : 0;
  const medianPlayers =
    playerCounts.length > 0
      ? playerCounts.sort((a, b) => a - b)[Math.floor(playerCounts.length / 2)]
      : 0;
  const medianTurns =
    turnCounts.length > 0
      ? turnCounts.sort((a, b) => a - b)[Math.floor(turnCounts.length / 2)]
      : 0;

  return {
    total_games: totalGames,
    total_turns: totalTurns,
    unique_players: uniquePlayers.size,
    total_time_played_ms: totalTimePlayed,
    median_time_per_game_ms: medianTime,
    median_players_per_game: medianPlayers,
    median_turns_per_game: medianTurns,
    top_prompts: Array.from(promptUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    top_responses: Array.from(responseUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    top_decks: Array.from(deckUsage.entries())
      .map(([deck_id, games]) => ({ deck_id, games }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5),
    top_months: Array.from(gamesPerMonth.entries())
      .map(([month, games]) => ({ month, games }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5),
  };
}

/**
 * Parses lobby data to generate user statistics.
 * @param validLobbies The lobbies to parse
 * @param userMergeMap Optional map of canonical UID to merged UIDs
 */
export async function parseUserStatistics(
  validLobbies: GameLobby[],
  userMergeMap: UserMergeMap,
): Promise<StatsContainer> {
  // Map to accumulate stats per user
  const userStatsMap = new Map<string, UserStats>();

  // Process each lobby
  for (const lobby of validLobbies) {
    // Create a map of player states for quick lookup
    const statesMap = new Map(lobby.player_states.map((s) => [s.uid, s]));

    const lobbyTime = lobby.time_created || new Date();
    const monthKey = `${lobbyTime.getFullYear()}-${String(
      lobbyTime.getMonth() + 1,
    ).padStart(2, '0')}`;

    // Process each player
    for (const player of lobby.players) {
      const state = statesMap.get(player.uid);
      if (!state) continue;

      const turnsCount = countResponsesByPlayerInLobby(lobby, player.uid);

      // Get canonical UID for this player (may be merged)
      const canonicalUid = userMergeMap.getCanonicalUid(player.uid);

      // Get or create stats entry for this user
      let userStat = userStatsMap.get(canonicalUid);
      if (!userStat) {
        userStat = {
          uid: canonicalUid,
          name: player.name,
          player_in_lobby_refs: [],
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
          lobby_ids: new Set<string>(),
          total_time_played_ms: 0,
          average_time_per_game_ms: 0,
          median_time_per_game_ms: 0,
          median_score_per_game: 0,
          game_durations_ms: [],
          game_scores: [],
          games_per_month: new Map<string, number>(),
          top_cards_played: [],
          top_liked_responses: [],
          top_teammates: [],
          top_prompts_played: [],
        };
        userStatsMap.set(canonicalUid, userStat);
      }
      userStat.player_in_lobby_refs.push(player);
      userStat.total_turns_played += turnsCount;
      userStat.lobby_ids.add(lobby.id);
      if (userStat.games) {
        userStat.games.add(lobby);
      }

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

      // Calculate game duration - only turns where this player was active
      const playedTurns = lobby.turns.filter(
        (turn) =>
          turn.player_responses.has(player.uid) ||
          turn.judge_uid === player.uid,
      );
      if (playedTurns.length > 1) {
        const firstTurn = playedTurns[0];
        const lastTurn = playedTurns[playedTurns.length - 1];
        if (
          firstTurn.time_created &&
          (lastTurn.time_created || lastTurn.phase_end_time)
        ) {
          const endTime = lastTurn.phase_end_time ?? lastTurn.time_created;
          const gameDurationMs =
            endTime.getTime() - firstTurn.time_created.getTime();
          userStat.total_time_played_ms += gameDurationMs;
          userStat.game_durations_ms.push(gameDurationMs);
        }
      }

      // Track individual game score
      userStat.game_scores.push(state.score);

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
    const gamesSize = stats.games?.size ?? 0;
    stats.total_games = gamesSize;
    stats.average_score_per_game =
      gamesSize > 0 ? stats.total_score / gamesSize : 0;
    stats.win_rate =
      stats.total_turns_played > 0
        ? stats.total_wins / stats.total_turns_played
        : 0;
    stats.average_time_per_game_ms =
      gamesSize > 0 ? stats.total_time_played_ms / gamesSize : 0;

    // Calculate median time per game
    if (stats.game_durations_ms.length > 0) {
      const sortedDurations = [...stats.game_durations_ms].sort(
        (a, b) => a - b,
      );
      const mid = Math.floor(sortedDurations.length / 2);
      stats.median_time_per_game_ms =
        sortedDurations.length % 2 === 0
          ? (sortedDurations[mid - 1] + sortedDurations[mid]) / 2
          : sortedDurations[mid];
    } else {
      stats.median_time_per_game_ms = 0;
    }

    // Calculate median score per game
    if (stats.game_scores.length > 0) {
      const sortedScores = [...stats.game_scores].sort((a, b) => a - b);
      const mid = Math.floor(sortedScores.length / 2);
      stats.median_score_per_game =
        sortedScores.length % 2 === 0
          ? (sortedScores[mid - 1] + sortedScores[mid]) / 2
          : sortedScores[mid];
    } else {
      stats.median_score_per_game = 0;
    }
  }

  // Convert to final stats format and filter
  const stats: UserStats[] = Array.from(userStatsMap.values()).sort(
    (a, b) => b.last_time_played!.getTime() - a.last_time_played!.getTime(),
  ); // Sort by latest played day

  const globalStats = calculateGlobalStats(validLobbies, userMergeMap);
  const availableYears = getAvailableYears(validLobbies);

  return new StatsContainer(stats, globalStats, userMergeMap, availableYears);
}

/**
 * Creates a user merge map from a list of stats.
 * This extracts which UIDs are merged together based on playerInLobbyRefs.
 */
export function createUserMergeMap(stats: UserStats[]): UserMergeMap {
  const mergeMap = new UserMergeMap();

  for (const stat of stats) {
    const allUids = Array.from(
      new Set(stat.player_in_lobby_refs.map((p) => p.uid)),
    );
    // Only add to map if there are multiple UIDs (i.e., merged users)
    if (allUids.length > 1 || allUids[0] !== stat.uid) {
      mergeMap.set(stat.uid, allUids);
    }
  }

  return mergeMap;
}

/**
 * Merges multiple user stats into a single combined user stat.
 * Returns the merged stats and the UIDs that were merged.
 * @param users Array of UserStats to merge
 * @param primaryUid The UID to use for the merged user (typically the first one)
 * @param primaryName The name to use for the merged user
 */
export function mergeUserStats(
  users: UserStats[],
  primaryUid: string,
  primaryName: string,
): { merged: UserStats; mergedUids: string[] } {
  if (users.length === 0) {
    throw new Error('Cannot merge empty user list');
  }

  const mergedGames = new Set<GameLobby>();
  const mergedLobbyIds = new Set<string>();
  const mergedPlayerRefs: PlayerInLobby[] = [];
  const mergedGamesPerMonth = new Map<string, number>();
  const mergedUids = new Set<string>();
  let totalTurnsPlayed = 0;
  let totalWins = 0;
  let totalLikes = 0;
  let totalScore = 0;
  let totalDiscards = 0;
  let totalTimePlayed = 0;
  const allGameDurations: number[] = [];
  const allGameScores: number[] = [];
  let isBot = false;
  let firstTime: Date | undefined = undefined;
  let lastTime: Date | undefined = undefined;

  // Combine all stats
  for (const user of users) {
    mergedPlayerRefs.push(...user.player_in_lobby_refs);
    // Collect all UIDs from this user
    for (const ref of user.player_in_lobby_refs) {
      mergedUids.add(ref.uid);
    }
    totalTurnsPlayed += user.total_turns_played;
    totalWins += user.total_wins;
    totalLikes += user.total_likes_received;
    totalScore += user.total_score;
    totalDiscards += user.total_discards;
    totalTimePlayed += user.total_time_played_ms;
    allGameDurations.push(...user.game_durations_ms);
    allGameScores.push(...user.game_scores);
    isBot = isBot || user.is_bot;

    // Add all games from this user
    if (user.games) {
      for (const game of user.games) {
        mergedGames.add(game);
        mergedLobbyIds.add(game.id);
      }
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

  // Calculate median time from all game durations
  let medianTime = 0;
  if (allGameDurations.length > 0) {
    const sortedDurations = [...allGameDurations].sort((a, b) => a - b);
    const mid = Math.floor(sortedDurations.length / 2);
    medianTime =
      sortedDurations.length % 2 === 0
        ? (sortedDurations[mid - 1] + sortedDurations[mid]) / 2
        : sortedDurations[mid];
  }

  // Calculate median score from all game scores
  let medianScore = 0;
  if (allGameScores.length > 0) {
    const sortedScores = [...allGameScores].sort((a, b) => a - b);
    const mid = Math.floor(sortedScores.length / 2);
    medianScore =
      sortedScores.length % 2 === 0
        ? (sortedScores[mid - 1] + sortedScores[mid]) / 2
        : sortedScores[mid];
  }

  // For the merged user, we need to recalculate top cards, responses, and teammates
  // by treating all the merged UIDs as the same person
  const merged: UserStats = {
    uid: primaryUid,
    name: primaryName,
    player_in_lobby_refs: mergedPlayerRefs,
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
    lobby_ids: mergedLobbyIds,
    first_time_played: firstTime,
    last_time_played: lastTime,
    total_time_played_ms: totalTimePlayed,
    average_time_per_game_ms: totalGames > 0 ? totalTimePlayed / totalGames : 0,
    median_time_per_game_ms: medianTime,
    median_score_per_game: medianScore,
    game_durations_ms: allGameDurations,
    game_scores: allGameScores,
    games_per_month: mergedGamesPerMonth,
    top_cards_played: [],
    top_liked_responses: [],
    top_teammates: [],
    top_prompts_played: [],
  };

  return {
    merged,
    mergedUids: Array.from(mergedUids),
  };
}

/**
 * Recalculates derived statistics for a merged user.
 * This should be called after merging users to properly calculate top cards, teammates, etc.
 */
export async function recalculateDerivedStats(
  allStats: UserStats[],
): Promise<void> {
  const userStatsMap = new Map<string, UserStats>();
  for (const stat of allStats) {
    userStatsMap.set(stat.uid, stat);
  }
  await calculateDerivedStats(userStatsMap);
}

export function exportGameDataToFile(gameData: GameLobby[]) {
  function mapResponseCard(card: ResponseCardInGame) {
    return copyFields(card, ['random_index', 'rating', 'type']);
  }
  const exportData = {
    version: 1,
    date_exported: new Date().toISOString(),
    total_games: gameData.length,
    games: gameData.map((lobby) => ({
      ...lobby,
      turns: lobby.turns.map((turn) => ({
        ...turn,
        prompts: turn.prompts.map((p) =>
          copyFields(p, ['random_index', 'rating']),
        ),
        player_responses: Array.from(turn.player_responses.entries()).map(
          ([uid, response]) => ({
            player_uid: uid,
            player_name: response.player_name,
            cards: response.cards.map(mapResponseCard),
            like_count: response.like_count,
          }),
        ),
      })),
      players: lobby.players,
      player_states: lobby.player_states.map((state) => ({
        ...state,
        // Not actually fetching this, but just in case:
        hand: Array.from(state.hand.values()).map(mapResponseCard),
        discarded: Array.from(state.discarded.values()).map(mapResponseCard),
        downvoted: Array.from(state.downvoted.values()).map(mapResponseCard),
      })),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const filename = `caa_game_data_${new Date().toISOString()}.json`;
  saveAs(blob, filename);
}
