import { Dropdown } from "react-bootstrap";
import { IconHamburger } from "./Icons";
import { CSSProperties } from "react";
import { CustomDropdown } from "./CustomDropdown";

interface MenuProps {
  className?: string,
  style?: CSSProperties,
}

export function GameMenu({ className, style }: MenuProps) {
  function handleEndGame() {
    // TODO: end game if you are the creator
  }
  return (
    <CustomDropdown className={className} style={style}
      toggle={<IconHamburger />} toggleClassName="game-menu-icon">
      <Dropdown.Menu>
        <Dropdown.Item onClick={handleEndGame}>End game</Dropdown.Item>
      </Dropdown.Menu>
    </CustomDropdown>
  );
}