import { ReactNode } from "react";
import { Col, Row } from "react-bootstrap";
import { Link, NavLink, Outlet } from "react-router-dom";
import { FillLayout } from "./FillLayout";

interface LayoutProps {
  links: Array<Link>,
  loginNode: ReactNode,
}

interface Link {
  label: string,
  path: string,
}

/** Made to work with React Router */
export function Sidebar({ links, loginNode }: LayoutProps) {
  return <FillLayout>
    <Row style={{ flexWrap: "nowrap", height: "100%" }}>
      <Col className="col-auto col-md-3 col-xl-2 px-sm-2 px-0">
        <div
          className="px-3 pt-2 text-white"
          style={{ display: "flex", flexDirection: "column", height: "100%", }}
        >
          <a
            className="pb-3 mb-md-0 me-md-auto text-white"
            style={{ display: "flex", textDecoration: "none" }}
          >
            <span className="fs-5 d-none d-sm-inline">Menu</span>
          </a>
          <ul
            id="menu"
            className="nav nav-pills mb-auto"
            style={{ flexDirection: "column", width: "100%", }}
          >
            {links.map(link =>
              <li key={link.path} className="nav-item" style={{ width: "100%" }}>
                <NavLink
                  to={link.path}
                  className={({ isActive, isPending }) =>
                    `nav-link align-middle ${isActive ? "active" : isPending ? "pending" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            )}
          </ul>
          <hr />
          {loginNode}
        </div>
      </Col>
      <Col style={{ paddingTop: "1em", paddingBottom: "1em" }}>
        <Outlet />
      </Col>
    </Row>
  </FillLayout>;
}
