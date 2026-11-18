'use client';

import { Drawer } from '@mantine/core';
import { useDisclosure, useMounted } from '@mantine/hooks';
import Link from 'next/link';

import { MENU_SECTIONS } from '@/lib/nav';
import { REPO_URL, type Section } from '@/lib/site';

import { IconClose, IconMenu } from './Icons';
import { Logo } from './Logo';
import classes from './PhoneMenu.module.css';
import { ThemeToggle } from './ThemeToggle';

/**
 * The phone menu (SPEC 6.2). The Menu control is rendered as a plain link to the footer's
 * navigation (#site-nav), so it works before hydration and without scripts. Once scripts run it
 * becomes a button that opens a full-screen dialog: focus moves to Close, Tab is trapped, Escape
 * closes, focus returns to the control and the page behind does not scroll.
 */
export function PhoneMenu({ section }: { section: Section | null }) {
  const [opened, { open, close }] = useDisclosure(false);
  // False on the server and until hydration, so the control starts as a plain link.
  const enhanced = useMounted();

  return (
    <>
      <a
        className={classes.menuBtn}
        href="#site-nav"
        {...(enhanced
          ? { role: 'button', 'aria-expanded': opened, 'aria-controls': 'menu' }
          : undefined)}
        onClick={(e) => {
          if (!enhanced) return;
          e.preventDefault();
          open();
        }}
        onKeyDown={(e) => {
          if (enhanced && e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
      >
        Menu
        <IconMenu />
      </a>
      <Drawer.Root
        opened={opened}
        onClose={close}
        position="top"
        size="100%"
        keepMounted
        trapFocus
        returnFocus
        lockScroll
        transitionProps={{ duration: 0 }}
        zIndex={50}
      >
        <Drawer.Content id="menu" aria-label="Menu" className={classes.menu} radius={0}>
          <div className={classes.bar}>
            <Logo />
            <button className={classes.menuBtn} type="button" onClick={close} data-autofocus>
              Close
              <IconClose />
            </button>
          </div>
          <ul className={classes.list}>
            {MENU_SECTIONS.map(({ section: s, href, name, hint }) => (
              <li key={s}>
                <Link
                  className={`${classes.brick} studs sec-${s}`}
                  href={href}
                  aria-current={section === s ? 'page' : undefined}
                  onClick={close}
                >
                  <b>{name}</b>
                  <span>{hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className={classes.links}>
            <Link href="/" onClick={close}>
              Home
            </Link>
            <a href={REPO_URL}>Source code</a>
          </div>
          <div className={classes.foot}>
            <span className={classes.themeLabel} id="menu-theme">
              Theme
            </span>
            <ThemeToggle variant="words" labelledBy="menu-theme" />
            <p className="small muted">
              Free and open source. It runs on your server, so there is nothing to sign in to here.
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
}
