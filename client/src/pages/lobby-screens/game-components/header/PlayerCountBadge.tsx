import { Dropdown } from 'react-bootstrap';
import { InlineButton } from '../../../../components/Buttons';
import { CustomDropdown } from '../../../../components/CustomDropdown';
import { IconCounter } from '../../../../components/IconCounter';
import { IconPersonInlineSmall } from '../../../../components/Icons';
import { useGameContext } from '../GameContext';
import { GamePlayerList } from '../GamePlayerList';

/** Shows player count and a dropdown menu with player list. */
export function PlayerCountBadge() {
  const { activePlayers } = useGameContext();
  return (
    <CustomDropdown
      toggle={
        <InlineButton className="menu-player-counter" title="Players">
          <IconCounter
            icon={<IconPersonInlineSmall />}
            count={activePlayers.length}
          />
        </InlineButton>
      }
    >
      <Dropdown.Menu>
        <GamePlayerList />
      </Dropdown.Menu>
    </CustomDropdown>
  );
}
