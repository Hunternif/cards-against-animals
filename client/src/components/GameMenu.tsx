import { Dropdown } from "react-bootstrap";
import { IconHamburger } from "./Icons";
import { CSSProperties, useContext } from "react";
import { CustomDropdown } from "./CustomDropdown";
import { endLobby, leaveLobby } from "../model/lobby-api";
import { User } from "firebase/auth";
import { GameLobby, GameTurn } from "../shared/types";
import { useNavigate } from "react-router-dom";
import { ErrorContext } from "./ErrorContext";

interface MenuProps {
  lobby: GameLobby,
  user: User,
  turn: GameTurn,
  className?: string,
  style?: CSSProperties,
}

export function GameMenu({ lobby, turn, user, className, style }: MenuProps) {
  const navigate = useNavigate();
  const { setError } = useContext(ErrorContext);
  const isJudge = turn.judge_uid === user.uid;

  async function handleLeave() {
    await leaveLobby(lobby, user)
      .then(() => navigate("/"))
      .catch((e) => setError(e));
  }

  async function handleEnd() {
    await endLobby(lobby).catch((e) => setError(e));
  }

  return (
    <CustomDropdown className={className} style={style}
      toggle={<IconHamburger />} toggleClassName="game-menu-icon">
      <Dropdown.Menu>
        <Dropdown.Item onClick={handleLeave}>Leave</Dropdown.Item>
        {isJudge && <Dropdown.Item onClick={handleEnd}>End game</Dropdown.Item>}
      </Dropdown.Menu>
    </CustomDropdown>
  );
}