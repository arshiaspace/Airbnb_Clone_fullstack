
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Globe2,
  House,
  Heart,
  Plane,
  Search,
  UserRound,
  ConciergeBell
} from 'lucide-react';

import { useApp } from './Providers';
import { useState } from 'react';

export default function Header() {
  const { user, setUserId, toast } = useApp();
  const path = usePathname();

  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="headinner">

          {/* LOGO */}
          <Link href="/" className="logo">
            <span className="logoSymbol">⌂</span>
            staybnb
          </Link>

          {/* MAIN NAVIGATION */}
          <nav
            className="topnav"
            aria-label="Main navigation"
          >
            <Link
              href="/"
              className={
                path === '/' || path.startsWith('/listings')
                  ? 'active'
                  : ''
              }
            >
              <House size={20} />
              Homes
            </Link>

            <button
              type="button"
              className="navAction"
              onClick={() =>
                toast('Experiences — Coming Soon!')
              }
            >
              <Plane size={20} />
              Experiences
            </button>

            <button
              type="button"
              className="navAction"
              onClick={() =>
                toast('Services — Coming Soon!')
              }
            >
              <ConciergeBell size={20} />
              Services
            </button>
          </nav>

          {/* RIGHT NAVIGATION */}
          <div className="headright">

            <Link
              className="hostlink"
              href="/host"
            >
              Become a host
            </Link>

            <Globe2 size={19} />

            {/* ACCOUNT MENU */}
            <div className="menuwrap">

              <button
                type="button"
                className="profile"
                onClick={() => setOpen(!open)}
                aria-label="Open user menu"
                aria-expanded={open}
              >
                <Menu size={19} />

                <span className="avatar">
                  {user.name.charAt(0)}
                </span>
              </button>

              {open && (
                <div className="menu">

                  <strong>Demo accounts</strong>

                  {[
                    { id: 1, name: 'Alex · Guest' },
                    { id: 2, name: 'Sofia · Host' },
                    { id: 3, name: 'Jamie · Host' }
                  ].map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => {
                        setUserId(u.id);
                        setOpen(false);
                      }}
                    >
                      {u.name}
                      {user.id === u.id ? ' ✓' : ''}
                    </button>
                  ))}

                  <hr />

                  <Link
                    href="/trips"
                    onClick={() => setOpen(false)}
                  >
                    My trips
                  </Link>

                  <Link
                    href="/?favorites=1"
                    onClick={() => setOpen(false)}
                  >
                    Wishlists
                  </Link>

                  <Link
                    href="/host"
                    onClick={() => setOpen(false)}
                  >
                    Host dashboard
                  </Link>

                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION */}
      <nav className="mobileNav">

        <Link href="/">
          <Search />
          Explore
        </Link>

        <Link href="/?favorites=1">
          <Heart />
          Wishlists
        </Link>

        <Link href="/trips">
          <Plane />
          Trips
        </Link>

        <Link href="/host">
          <UserRound />
          Hosting
        </Link>

      </nav>
    </>
  );
}
