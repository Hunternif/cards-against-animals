import { User } from "firebase/auth";
import React, { MouseEventHandler, ReactNode } from "react";
import { Dropdown } from "react-bootstrap";
import { firebaseAuth } from "../firebase";

interface UserProps {
  user: User;
}

interface ToggleProps {
  onClick: MouseEventHandler,
  children: ReactNode,
}

// The forwardRef is important!
// Dropdown needs access to the DOM node in order to position the Menu
const CustomToggle = React.forwardRef<HTMLAnchorElement, ToggleProps>(
  ({ children, onClick }, ref) => (
    <a
      href=""
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="text-white dropdown-toggle"
    >
      {children}
    </a>
  ));

export function AdminUserPill({ user }: UserProps) {
  return (
    <Dropdown>
      <Dropdown.Toggle as={CustomToggle}
      >
        <img src={user.photoURL ?? ""}
          width="30" height="30"
          style={{ borderRadius: "50%" }}
        />
        <span style={{ marginLeft: "0.5em", marginRight: "0.2em" }}>
          {user.displayName}
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => firebaseAuth.signOut()}>Sign Out</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}