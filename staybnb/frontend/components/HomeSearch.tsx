'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Minus, Plus, Search, UsersRound, X } from 'lucide-react';

type Props = {
  onSearch: (value: { destination: string; checkIn: string; checkOut: string; guests: number }) => void;
};
type Panel = 'where' | 'dates' | 'who' | null;
const destinations = ['Santorini, Greece', 'Jaipur, India', 'Paris, France', 'Aspen, United States', 'Bali, Indonesia', 'Goa, India', 'Tokyo, Japan'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => iso(new Date());
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const labelDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function HomeSearch({ onSearch }: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const totalGuests = adults + children;

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setPanel(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setPanel(null); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);

  function chooseDate(day: string) {
    if (day < today()) return;
    if (!checkIn || checkOut || day <= checkIn) {
      setCheckIn(day);
      setCheckOut('');
      setError('');
    } else {
      setCheckOut(day);
      setPanel('who');
    }
  }

  function search() {
    if (!!checkIn !== !!checkOut || (checkIn && checkOut <= checkIn)) {
      setError('Select both a check-in and checkout date.');
      setPanel('dates');
      return;
    }
    setError('');
    setPanel(null);
    onSearch({ destination: destination.trim(), checkIn, checkOut, guests: totalGuests });
  }

  function calendar(d: Date) {
    const year = d.getFullYear(), m = d.getMonth();
    const offset = new Date(year, m, 1).getDay();
    const days = new Date(year, m + 1, 0).getDate();
    return <div className="hsMonth" key={`${year}-${m}`}>
      <h3>{d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
      <div className="hsDays">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => <span className="hsWeek" key={x}>{x}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`gap-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = iso(new Date(year, m, i + 1));
          const disabled = date < today();
          const selected = date === checkIn || date === checkOut;
          const between = !!(checkIn && checkOut && date > checkIn && date < checkOut);
          return <button type="button" key={date} disabled={disabled} aria-label={date} aria-pressed={selected} onClick={() => chooseDate(date)} className={`hsDay ${selected ? 'isSelected' : ''} ${between ? 'inRange' : ''}`}>{i + 1}</button>;
        })}
      </div>
    </div>;
  }

  function counter(name: string, description: string, value: number, onChange: (n: number) => void, minimum: number) {
    return <div className="hsCounter" key={name}>
      <div><strong>{name}</strong><small>{description}</small></div>
      <div className="hsStepper">
        <button type="button" aria-label={`Remove ${name.toLowerCase()}`} disabled={value <= minimum} onClick={() => onChange(value - 1)}><Minus size={15} /></button>
        <span>{value}</span>
        <button type="button" aria-label={`Add ${name.toLowerCase()}`} disabled={totalGuests >= 20} onClick={() => onChange(value + 1)}><Plus size={15} /></button>
      </div>
    </div>;
  }

  const matches = destinations.filter(x => x.toLowerCase().includes(destination.toLowerCase())).slice(0, 5);

  return <div className="hsOuter" ref={root}>
    <div className="hsBar" role="search" aria-label="Search stays">
      <div className={`hsField hsWhere ${panel === 'where' ? 'hsActive' : ''}`}>
        <label htmlFor="hs-destination">Where</label>
        <input id="hs-destination" value={destination} placeholder="Search destinations" onFocus={() => setPanel('where')} onChange={e => { setDestination(e.target.value); setPanel('where'); }} autoComplete="off" />
      </div>
      <button type="button" className={`hsField hsClick ${panel === 'dates' && !checkIn ? 'hsActive' : ''}`} onClick={() => setPanel(panel === 'dates' ? null : 'dates')}><strong>Check in</strong><span>{checkIn ? labelDate(checkIn) : 'Add dates'}</span></button>
      <button type="button" className={`hsField hsClick ${panel === 'dates' && checkIn ? 'hsActive' : ''}`} onClick={() => setPanel(panel === 'dates' ? null : 'dates')}><strong>Check out</strong><span>{checkOut ? labelDate(checkOut) : 'Add dates'}</span></button>
      <button type="button" className={`hsField hsWho hsClick ${panel === 'who' ? 'hsActive' : ''}`} onClick={() => setPanel(panel === 'who' ? null : 'who')}><strong>Who</strong><span><UsersRound size={14} /> {totalGuests} guest{totalGuests === 1 ? '' : 's'}</span></button>
      <button type="button" className="hsSubmit" aria-label="Search properties" onClick={search}><Search size={20} /><span>Search</span></button>
    </div>
    {error && <p className="hsError" role="alert">{error}</p>}
    {panel === 'where' && <div className="hsPopover hsLocationPanel"><h3>Suggested destinations</h3>{(matches.length ? matches : [destination]).filter(Boolean).map(d => <button key={d} type="button" onClick={() => { setDestination(d); setPanel('dates'); }}><span className="hsPlaceIcon"><MapPin size={20}/></span><span>{d}</span></button>)}</div>}
    {panel === 'dates' && <div className="hsPopover hsCalendarPanel">
      <div className="hsPanelHeading"><div><h3>Select dates</h3><p>Choose your check-in and checkout dates</p></div><div className="hsMonthControls"><button type="button" aria-label="Previous month" disabled={month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth()} onClick={() => setMonth(m => addMonths(m, -1))}><ChevronLeft /></button><button type="button" aria-label="Next month" onClick={() => setMonth(m => addMonths(m, 1))}><ChevronRight /></button></div></div>
      <div className="hsMonths">{calendar(month)}{calendar(addMonths(month, 1))}</div>
      <div className="hsPanelFooter"><button type="button" onClick={() => { setCheckIn(''); setCheckOut(''); setError(''); }}>Clear dates</button><button type="button" onClick={() => setPanel(null)}>Close <X size={14}/></button></div>
    </div>}
    {panel === 'who' && <div className="hsPopover hsGuestPanel">
      {counter('Adults', 'Ages 13 or above', adults, setAdults, 1)}
      {counter('Children', 'Ages 0–12', children, setChildren, 0)}
      <div className="hsPanelFooter"><button type="button" onClick={() => setPanel(null)}>Done</button></div>
    </div>}
  </div>;
}
