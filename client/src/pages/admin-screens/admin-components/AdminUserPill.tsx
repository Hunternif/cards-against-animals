import { User } from "firebase/auth";
import { Dropdown } from "react-bootstrap";
import { signOut } from "../../../api/users-api";
import { CustomDropdown } from "../../../components/CustomDropdown";

interface UserProps {
  user: User;
}

export function AdminUserPill({ user }: UserProps) {
  return (
    <CustomDropdown showArrow={true}
      style={{ fontWeight: 500 }}
      toggle={<>
        <img src={user.photoURL ?? ""}
          width="30" height="30"
          style={{ borderRadius: "50%" }}
        />
        <span style={{ marginLeft: "0.5em", marginRight: "0.2em" }}>
          {user.displayName}
        </span>
      </>
      }>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => signOut(user)}>Sign Out</Dropdown.Item>
      </Dropdown.Menu>
    </CustomDropdown>
  );
}