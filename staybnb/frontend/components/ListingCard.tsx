'use client';
import Link from 'next/link';
import {Heart, Star} from 'lucide-react';
import {Listing, money} from '@/lib/api';
import {useApp} from './Providers';

export default function ListingCard({listing}: {listing: Listing}) {
  const {favorites, toggleFavorite} = useApp();
  const saved = favorites.includes(listing.id);
  return <article className="listingCard">
    <div className="photoWrap">
      <Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`}><img src={listing.photos[0]} alt={listing.title} loading="lazy"/></Link>
      {listing.rating >= 4.8 && <span className="favoriteBadge">Guest favorite</span>}
      <button type="button" className="heart" onClick={() => toggleFavorite(listing.id)} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved}><Heart size={24} fill={saved ? '#ff385c' : 'rgba(0,0,0,.52)'} stroke="white" strokeWidth={2}/></button>
    </div>
    <Link href={`/listings/${listing.id}`} className="cardDetail">
      <div className="cardTop"><strong className="ellipsis">{listing.location}, {listing.country}</strong><span><Star size={13} fill="currentColor"/> {listing.rating.toFixed(2)}</span></div>
      <div className="muted ellipsis">{listing.title}</div>
      <div className="muted">Flexible dates</div>
      <p className="price"><strong>{money(listing.price)}</strong> <span>night</span></p>
    </Link>
  </article>;
}
