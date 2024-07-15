import { Dropdown } from 'react-bootstrap';
import { InlineButton } from '../../../../components/Buttons';
import { CustomDropdown } from '../../../../components/CustomDropdown';
import { IconCounter } from '../../../../components/IconCounter';
import { IconHeartInline, IconStarInline } from '../../../../components/Icons';
import { Scoreboard } from '../../../../components/Scoreboard';
import { useGameContext } from '../GameContext';

/** Shows current player score and a dropdown menu with the scoreboard. */
export function ScoreBadge() {
  const { lobby, playerState, players } = useGameContext();
  return (
    <CustomDropdown
      toggle={
        <InlineButton title="Scores" style={{ whiteSpace: 'nowrap' }}>
          <IconCounter icon={<IconStarInline />} count={playerState.score} />
          {playerState.likes > 0 && (
            <IconCounter icon={<IconHeartInline />} count={playerState.likes} />
          )}
        </InlineButton>
      }
    >
      <Dropdown.Menu>
        <div className="menu-scoreboard">
          <Scoreboard lobby={lobby} players={players} />
        </div>
      </Dropdown.Menu>
    </CustomDropdown>
  );
}
