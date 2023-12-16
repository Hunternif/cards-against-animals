import { Dropdown } from "react-bootstrap";
import { IconHamburger } from "./Icons";
import { CSSProperties } from "react";
import { CustomDropdown } from "./CustomDropdown";
import { leaveLobby } from "../model/lobby-api";
import { User } from "firebase/auth";
import { GameLobby } from "../shared/types";
import { useNavigate } from "react-router-dom";

interface MenuProps {
  lobby: GameLobby,
  user: User,
  className?: string,
  style?: CSSProperties,
}

export function GameMenu({ lobby, user, className, style }: MenuProps) {
  const navigate = useNavigate();
  async function handleLeave() {
    await leaveLobby(lobby, user);
    navigate("/");
  }
  return (
    <CustomDropdown className={className} style={style}
      toggle={<IconHamburger />} toggleClassName="game-menu-icon">
      <Dropdown.Menu>
        <Dropdown.Item onClick={handleLeave}>Leave</Dropdown.Item>
      </Dropdown.Menu>
    </CustomDropdown>
  );
}