'use client';

import {useEffect, useRef, useState, Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {
  SlidersHorizontal, Search, ChevronLeft, ChevronRight, Mountain,
  Trees, Waves, Palmtree, House, Paintbrush, Sparkles, X, Wifi,
  
} from 'lucide-react';
import HomeSearch from '@/components/HomeSearch';
import ListingCard from '@/components/ListingCard';
import {api, Listing} from '@/lib/api';
import {useApp} from '@/components/Providers';

const categories = [
  {name: 'All', icon: House},
  {name: 'Amazing views', icon: Mountain},
  {name: 'Cabins', icon: Trees},
  {name: 'Amazing pools', icon: Waves},
  {name: 'Beachfront', icon: Palmtree},
  {name: 'Design', icon: Paintbrush},
  {name: 'Countryside', icon: Sparkles},
];

function HomeContent() {
  const searchParams = useSearchParams();
  const {favorites} = useApp();
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('All');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [amenity, setAmenity] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [items, setItems] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [searchReset, setSearchReset] = useState(0);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);
  const onlyFavorites = searchParams.get('favorites') === '1';

  useEffect(() => { setPage(1); }, [destination, category, checkIn, checkOut, guests, minPrice, maxPrice, amenity, onlyFavorites]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams({page: String(page), limit: '12', guests: String(guests)});
    if (destination.trim()) params.set('q', destination.trim());
    if (category !== 'All') params.set('category', category);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (amenity) params.set('amenities', amenity);
    if (checkIn && checkOut && checkOut > checkIn) {
      params.set('check_in', checkIn);
      params.set('check_out', checkOut);
    }
    api<{items: Listing[]; pages: number; total: number}>(`/api/listings?${params}`)
      .then(response => {
        if (!active) return;
        setItems(response.items);
        setPages(response.pages);
        setTotal(response.total);
        setError('');
      })
      .catch((e: Error) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [destination, category, checkIn, checkOut, guests, minPrice, maxPrice, amenity, page]);

  const displayed = onlyFavorites ? items.filter(item => favorites.includes(item.id)) : items;

  const resetFilters = () => {
    setMinPrice(''); setMaxPrice(''); setAmenity('');
  };

  return <main className="homePage">
    <div className="homeSearchOuter">
      <HomeSearch key={searchReset} onSearch={({destination: place, checkIn: arrival, checkOut: departure, guests: count}) => {
        setDestination(place.split(',')[0].trim());
        setCheckIn(arrival);
        setCheckOut(departure);
        setGuests(count);
        setPage(1);
        window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'}));
      }}/>
    </div>

    <div className="container homeContent">
      <div className="homeFilterBar">
        <div className="homeCategoryScroll" aria-label="Browse categories">
          {categories.map(({name, icon: Icon}) => <button key={name} type="button" className={`homeCategory ${category === name ? 'isActive' : ''}`} onClick={() => setCategory(name)} aria-pressed={category === name}><Icon size={25} strokeWidth={1.6}/><span>{name}</span></button>)}
        </div>
        <button type="button" className="homeFiltersButton" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={17}/> Filters{(minPrice || maxPrice || amenity) && <i aria-label="Active filters"/>}</button>
      </div>

      <div ref={resultsRef} className="homeResultsHeading">
        <div><h1>{onlyFavorites ? 'Your wishlist' : destination ? `Stays in ${destination}` : category === 'All' ? 'Explore stays around the world' : `${category} stays`}</h1><p>{onlyFavorites ? 'The places you saved' : loading ? 'Finding places for you…' : `${total} stays ${destination ? 'found' : 'to explore'}`}</p></div>
        {(destination || category !== 'All' || checkIn || checkOut) && <button type="button" className="homeClearButton" onClick={() => {setDestination('');setCategory('All');setCheckIn('');setCheckOut('');setSearchReset(n => n+1);setPage(1);}}>Clear search <X size={14}/></button>}
      </div>

      {error ? <div className="empty" role="alert">Cannot connect to the API: {error}. Make sure the backend is running on port 8000.</div>
        : loading ? <div className="cardsGrid">{Array.from({length: 8}, (_, i) => <div key={i} className="skeleton"/>)}</div>
        : displayed.length ? <div className="cardsGrid">{displayed.map(item => <ListingCard key={item.id} listing={item}/>)}</div>
        : <div className="empty"><Search size={32}/><h2>No stays found</h2><p>Try another destination, date or category.</p><button className="primary" type="button" onClick={() => {setDestination('');setCategory('All');resetFilters();setCheckIn('');setCheckOut('');setSearchReset(n => n+1);}}>Clear filters</button></div>}

      {!onlyFavorites && pages > 1 && <div className="pages"><button disabled={page <= 1} onClick={() => {setPage(p => p-1);resultsRef.current?.scrollIntoView({behavior: 'smooth'});}}><ChevronLeft size={18}/> Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => {setPage(p => p+1);resultsRef.current?.scrollIntoView({behavior: 'smooth'});}}>Next <ChevronRight size={18}/></button></div>}
    </div>

    {filtersOpen && <div className="overlay" onMouseDown={() => setFiltersOpen(false)}><div className="filterModal" role="dialog" aria-modal="true" aria-label="Filter listings" onMouseDown={e => e.stopPropagation()}><div className="modalHead"><h2>Filters</h2><button aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X size={20}/></button></div><h3>Price range per night</h3><div className="formRow"><label>Minimum $<input type="number" min={0} value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"/></label><label>Maximum $<input type="number" min={0} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any"/></label></div><h3>Amenities</h3><div className="pillChoices">{['', 'Wifi', 'Kitchen', 'Free parking', 'Air conditioning', 'Workspace', 'Washer', 'TV'].map(a => <button type="button" className={amenity === a ? 'selected' : ''} onClick={() => setAmenity(a)} key={a}>{a ? <><Wifi size={15}/> {a}</> : 'Any amenities'}</button>)}</div><div className="modalBottom"><button className="underlined" onClick={resetFilters}>Clear all</button><button className="primary" onClick={() => setFiltersOpen(false)}>Show stays</button></div></div></div>}
  </main>;
}

export default function Home() { return <Suspense fallback={<div className="container">Loading stays…</div>}><HomeContent/></Suspense>; }
