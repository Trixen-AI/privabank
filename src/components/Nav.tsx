import { useEffect, useState } from "react";
import { SmartLink } from "./ui/SmartLink";
import { NAV } from "../data/site";
import { Logo } from "./ui/Logo";
import { Icon } from "./ui/Icon";

type Link = { title: string; desc: string; href: string; icon: string; soon?: boolean };

function MegaLink({ link, accent = false }: { link: Link; accent?: boolean }) {
  const cls = `mega-link${accent ? " mega-link--accent" : ""}${link.soon ? " mega-link--soon" : ""}`;
  const body = (
    <span className="mega-tx">
      <span className="t">
        {link.title}
        {link.soon ? <span className="mega-soon">Coming soon</span> : <i className="arr">›</i>}
      </span>
      <span className="d">{link.desc}</span>
    </span>
  );
  if (link.soon) {
    return (
      <div className={cls} aria-disabled="true">
        {body}
      </div>
    );
  }
  return (
    <SmartLink className={cls} href={link.href} role="menuitem">
      {body}
    </SmartLink>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [acc, setAcc] = useState<string | null>("product");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav className="nav" data-screen-label="Nav">
        <div className="nav-inner">
          <SmartLink className="brand" href="#top" aria-label="PrivaBank home">
            <Logo />
          </SmartLink>

          <div className="nav-group">
            <div className="nav-item">
              <button className="nav-trigger" type="button" aria-haspopup="true">
                Product <i className="chev arr">›</i>
              </button>
              <div className="mega mega--cats" role="menu">
                <div className="mega-cats">
                  {NAV.product.columns.map((col) => (
                    <div key={col.head} className={`mega-col mega-col--${col.variant}`}>
                      <div className="mega-cat-head">{col.head}</div>
                      {col.links.map((l) => (
                        <MegaLink key={l.title} link={l} />
                      ))}
                    </div>
                  ))}
                </div>
                <MegaLink link={NAV.product.cta} accent />
              </div>
            </div>

            <div className="nav-item">
              <button className="nav-trigger" type="button" aria-haspopup="true">
                Resources <i className="chev arr">›</i>
              </button>
              <div className="mega" role="menu">
                {NAV.resources.links.map((l) => (
                  <MegaLink key={l.title} link={l} />
                ))}
                <div className="mega-foot">
                  <SmartLink href={NAV.resources.foot.href}>
                    {NAV.resources.foot.label} <i className="arr">›</i>
                  </SmartLink>
                </div>
              </div>
            </div>

            <div className="nav-item">
              <button className="nav-trigger" type="button" aria-haspopup="true">
                Developers <i className="chev arr">›</i>
              </button>
              <div className="mega" role="menu">
                {NAV.developers.links.map((l) => (
                  <MegaLink key={l.title} link={l} />
                ))}
                <div className="mega-foot">
                  <SmartLink href={NAV.developers.foot.href}>
                    {NAV.developers.foot.label} <i className="arr">›</i>
                  </SmartLink>
                </div>
              </div>
            </div>
          </div>

          <div className="nav-right">
            <SmartLink className="nav-login" href="/app">
              Log in
            </SmartLink>
            <SmartLink className="btn btn-pri" href="/app">
              Sign up
            </SmartLink>
          </div>

          <button
            className="burger"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
        </div>
      </nav>

      <MobileMenu open={open} acc={acc} setAcc={setAcc} onNavigate={() => setOpen(false)} />
    </>
  );
}

function MobileSection({
  id,
  label,
  links,
  acc,
  setAcc,
  onNavigate,
}: {
  id: string;
  label: string;
  links: Link[];
  acc: string | null;
  setAcc: (v: string | null) => void;
  onNavigate: () => void;
}) {
  const isOpen = acc === id;

  return (
    <div className="m-sec">
      <button
        className="m-head"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setAcc(isOpen ? null : id)}
      >
        {label}
        <Icon name="chevron-down" />
      </button>
      <div className="m-panel">
        <div className="m-panel-inner">
          {links.map((l) => (
            <SmartLink key={l.title} className="m-link" href={l.href} onClick={onNavigate}>
              <span className="mega-ico">
                <Icon name={l.icon} />
              </span>
              <span>
                <span className="t">{l.title}</span>
                <span className="d">{l.desc}</span>
              </span>
            </SmartLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({
  open,
  acc,
  setAcc,
  onNavigate,
}: {
  open: boolean;
  acc: string | null;
  setAcc: (v: string | null) => void;
  onNavigate: () => void;
}) {
  const productLinks = NAV.product.columns.flatMap((c) => c.links);
  return (
    <div className={`mobile${open ? " open" : ""}`} id="mobile">
      <MobileSection
        id="product"
        label="Product"
        links={[...productLinks, NAV.product.cta]}
        acc={acc}
        setAcc={setAcc}
        onNavigate={onNavigate}
      />
      <MobileSection
        id="resources"
        label="Resources"
        links={NAV.resources.links}
        acc={acc}
        setAcc={setAcc}
        onNavigate={onNavigate}
      />
      <MobileSection
        id="developers"
        label="Developers"
        links={NAV.developers.links}
        acc={acc}
        setAcc={setAcc}
        onNavigate={onNavigate}
      />
      <div className="m-cta">
        <SmartLink className="btn btn-sec" href="/app" onClick={onNavigate}>
          Log in
        </SmartLink>
        <SmartLink className="btn btn-pri" href="/app" onClick={onNavigate}>
          Sign up
        </SmartLink>
      </div>
    </div>
  );
}
