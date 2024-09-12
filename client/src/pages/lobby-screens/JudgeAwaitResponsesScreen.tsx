import { useContext, useEffect, useState } from 'react';
import bell_double from '../../assets/sounds/bell_double.mp3';
import { GameButton } from '../../components/Buttons';
import { ErrorContext } from '../../components/ErrorContext';
import { GameLayout } from '../../components/layout/GameLayout';
import { ScreenSizeSwitch } from '../../components/layout/ScreenSizeSwitch';
import { useSoundOnResponse } from '../../hooks/sound-hooks';
import { startReadingPhase } from '../../api/turn/turn-control-api';
import { PlayerInLobby, PlayerResponse } from '../../shared/types';
import { CardPromptWithCzar } from './game-components/CardPrompt';
import { useGameContext } from './game-components/GameContext';
import { MiniCardResponse } from './game-components/MiniCardResponse';
import { ResponseCount } from './game-components/ResponseCount';
import { Soundboard } from './game-components/Soundboard';
import { TurnTimer } from './game-components/TurnTimer';

// const dummyPlayer = new PlayerInLobby("01", "Dummy");
// const dummyPlayers = new Array<PlayerInLobby>(10).fill(dummyPlayer, 0, 20);

/** Similar to GameMiniResponses, but slightly different */
export function JudgeAwaitResponsesScreen() {
  // const players = dummyPlayers;
  const { lobby, turn, activePlayers, isJudge, prompt, judge, responses } =
    useGameContext();
  const { setError } = useContext(ErrorContext);

  // Whenever a new response is added, play a sound:
  useSoundOnResponse();

  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }

  async function handleNext() {
    await startReadingPhase(lobby, turn).catch((e) => setError(e));
  }

  // Filter out the judge:
  const validPlayers = activePlayers.filter((p) => p.uid !== judge.uid);

  // Can skip to the next phase?
  const allResponded = validPlayers.every((p) => findResponse(p));
  const timeRanOut =
    turn.phase_end_time && new Date().getTime() > turn.phase_end_time.getTime();
  const [timeRanOutNow, setTimeRanOutNow] = useState(false);

  // Play sound when everyone has answered:
  useEffect(() => {
    if (allResponded && isJudge) {
      new Audio(bell_double).play();
    }
  }, [allResponded]);

  return (
    <GameLayout>
      <header>
        <h2 className="dim">Wait for responses:</h2>
      </header>
      <section>
        <CardPromptWithCzar card={prompt} />
        <ScreenSizeSwitch
          widthBreakpoint={500}
          smallScreen={<ResponseCount />}
          bigScreen={
            <DetailedResponses
              players={validPlayers}
              responses={responses}
              pick={prompt?.pick ?? 0}
            />
          }
        />
        <TurnTimer onClear={() => setTimeRanOutNow(true)} />
      </section>
      <footer>
        {isJudge && (allResponded || timeRanOut || timeRanOutNow) && (
          <>
            <span>
              {allResponded
                ? 'All players responded!'
                : timeRanOut || timeRanOutNow
                ? 'Time ran out!'
                : null}
            </span>
            <GameButton accent onClick={handleNext}>
              Next
            </GameButton>
          </>
        )}
        <Soundboard />
      </footer>
    </GameLayout>
  );
}

interface DetailedResponsesProps {
  pick: number;
  players: PlayerInLobby[];
  responses: PlayerResponse[];
}

function DetailedResponses({
  pick,
  players,
  responses,
}: DetailedResponsesProps) {
  function findResponse(player: PlayerInLobby): PlayerResponse | null {
    return responses.find((res) => res.player_uid === player.uid) ?? null;
  }
  return (
    <>
      {players &&
        players.map((player) => {
          const response = findResponse(player);
          return (
            <MiniCardResponse
              key={player.uid}
              player={player}
              ready={response != null}
              pick={pick}
            />
          );
        })}
    </>
  );
}
