"""Staybnb API: seeded SQLite marketplace with mock users and transactional reservations."""
import os
import json
import random
from datetime import date, timedelta, datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict, model_validator
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Date, DateTime, Text, select, func, and_
from sqlalchemy.orm import DeclarativeBase, relationship, Session, sessionmaker, selectinload
from sqlalchemy.exc import IntegrityError

DB_URL = os.getenv('DATABASE_URL', 'sqlite:///./staybnb.db')
engine = create_engine(DB_URL, connect_args={'check_same_thread': False, 'timeout': 30} if DB_URL.startswith('sqlite') else {})
if DB_URL.startswith('sqlite'):
    from sqlalchemy import event
    @event.listens_for(engine, 'connect')
    def pragmas(conn, rec):
        conn.execute('PRAGMA foreign_keys=ON')
        conn.execute('PRAGMA busy_timeout=30000')
        conn.execute('PRAGMA journal_mode=WAL')
SessionLocal = sessionmaker(bind=engine)
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    avatar = Column(String(1000))
    listings = relationship('Listing', back_populates='host')
class Listing(Base):
    __tablename__ = 'listings'
    id = Column(Integer, primary_key=True)
    host_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(160), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    category = Column(String(40), nullable=False)
    price = Column(Float, nullable=False)
    max_guests = Column(Integer, nullable=False)
    bedrooms = Column(Integer, nullable=False)
    beds = Column(Integer, nullable=False)
    baths = Column(Integer, nullable=False)
    photos_json = Column(Text, nullable=False)
    amenities_json = Column(Text, nullable=False)
    rating = Column(Float, default=4.9)
    host = relationship('User', back_populates='listings')
    bookings = relationship('Booking', back_populates='listing', cascade='all, delete-orphan')
    reviews = relationship('Review', back_populates='listing', cascade='all, delete-orphan')
class Booking(Base):
    __tablename__ = 'bookings'
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey('listings.id', ondelete='CASCADE'), nullable=False, index=True)
    guest_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default='confirmed')
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    listing = relationship('Listing', back_populates='bookings')
    guest = relationship('User')
class Review(Base):
    __tablename__ = 'reviews'
    id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey('listings.id', ondelete='CASCADE'), nullable=False)
    author = Column(String(120), nullable=False)
    body = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    listing = relationship('Listing', back_populates='reviews')
class Favorite(Base):
    __tablename__ = 'favorites'
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    listing_id = Column(Integer, ForeignKey('listings.id', ondelete='CASCADE'), primary_key=True)

class ListingInput(BaseModel):
    title: str = Field(min_length=5, max_length=180)
    description: str = Field(min_length=10)
    location: str = Field(min_length=2)
    country: str = Field(min_length=2)
    category: str = 'Amazing views'
    price: float = Field(gt=0)
    max_guests: int = Field(ge=1, le=20)
    bedrooms: int = Field(ge=1)
    beds: int = Field(ge=1)
    baths: int = Field(ge=1)
    photos: list[str] = Field(min_length=1)
    amenities: list[str] = []
class BookingInput(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1)
    @model_validator(mode='after')
    def dates(self):
        if self.check_in < date.today(): raise ValueError('Check-in cannot be in the past')
        if self.check_out <= self.check_in: raise ValueError('Check-out must follow check-in')
        return self

SEED = [
 ('A serene retreat in the hills','Manali','India','Cabins',185,4,2,'photo-1449158743715-0a90ebb6d2d8'),
 ('The modern mountain chalet','Zermatt','Switzerland','Amazing views',325,6,3,'photo-1510798831971-661eb04b3739'),
 ('Sun-drenched villa with pool','Bali','Indonesia','Amazing pools',218,6,3,'photo-1564013799919-ab600027ffc6'),
 ('A dreamy coastal escape','Amalfi Coast','Italy','Beachfront',290,4,2,'photo-1499793983690-e29da59ef1c2'),
 ('Architect-designed loft','Copenhagen','Denmark','Design',195,3,1,'photo-1600607687920-4e2a09cf159d'),
 ('Secluded glass cabin','Oslo','Norway','Cabins',242,2,1,'photo-1484154218962-a197022b5858'),
 ('Private villa in the palms','Goa','India','Amazing pools',162,8,4,'photo-1613490493576-7fde63acd811'),
 ('Rustic farmhouse hideaway','Tuscany','Italy','Countryside',275,6,3,'photo-1600047509807-ba8f99d2cdde'),
 ('Stylish home by the sea','Lisbon','Portugal','Beachfront',169,4,2,'photo-1600566753190-17f0baa2a6c3'),
 ('Minimalist desert sanctuary','Joshua Tree','United States','Design',228,4,2,'photo-1600607687939-ce8a6c25118c'),
 ('Romantic lakefront cottage','Lake Como','Italy','Amazing views',310,2,1,'photo-1449844908441-8829872d2607'),
 ('Beautiful bamboo hideout','Ubud','Indonesia','Countryside',145,2,1,'photo-1520250497591-112f2f40a3f4'),
 ('Elegant city penthouse','Paris','France','Design',285,4,2,'photo-1600210492486-724fe5c67fb0'),
 ('Warm ski cabin in the pines','Aspen','United States','Cabins',355,6,3,'photo-1518780664697-55e3ad937233'),
 ('Charming courtyard residence','Jaipur','India','Countryside',135,5,2,'photo-1600566753086-00f18fb6b3ea'),
 ('Stunning cliffside retreat','Santorini','Greece','Amazing views',385,4,2,'photo-1613977257363-707ba9348227'),
]
def img(photo, index=0):
    return f'https://images.unsplash.com/{photo}?auto=format&fit=crop&w={1400 if index==0 else 1000}&q=85'
def seed(db):
    if db.scalar(select(func.count(User.id))): return
    db.add_all([User(id=1,name='Alex Morgan',avatar='https://i.pravatar.cc/120?img=12'),User(id=2,name='Sofia Patel',avatar='https://i.pravatar.cc/120?img=47'),User(id=3,name='Jamie Rivera',avatar='https://i.pravatar.cc/120?img=33')])
    db.flush()
    for i,(title,loc,country,cat,price,guests,rooms,photo) in enumerate(SEED):
        listing = Listing(host_id=2 if i%2==0 else 3,title=title,description=f'Unwind at {title.lower()}, a thoughtfully curated stay in {loc}. Enjoy beautiful spaces, remarkable surroundings, and all the little comforts that make a getaway memorable. Perfect for a relaxed trip with your favorite people.',location=loc,country=country,category=cat,price=price,max_guests=guests,bedrooms=rooms,beds=rooms+1,baths=max(1,rooms-1),photos_json=json.dumps([img(photo),img('photo-1600607687920-4e2a09cf159d',1),img('photo-1600566753086-00f18fb6b3ea',1),img('photo-1600210492486-724fe5c67fb0',1),img('photo-1600566753190-17f0baa2a6c3',1)]),amenities_json=json.dumps(['Wifi','Kitchen','Free parking','Air conditioning','Workspace','Washer','TV']),rating=round(4.72+(i%7)*.04,2))
        db.add(listing); db.flush()
        db.add(Review(listing_id=listing.id,author=['Olivia','Daniel','Maya'][i%3],body='Absolutely beautiful stay! The space was even better than the photos and the host was wonderful. Would definitely come back.',rating=5))
    db.flush()
    tomorrow=date.today()+timedelta(days=12)
    for lid in (1,3,6):
        db.add(Booking(listing_id=lid,guest_id=1,check_in=tomorrow+timedelta(days=lid*3),check_out=tomorrow+timedelta(days=lid*3+3),guests=2,total=round(SEED[lid-1][4]*3*1.12,2)))
    db.commit()
@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(engine)
    with SessionLocal() as db: seed(db)
    yield
app=FastAPI(title='Staybnb API',version='1.0.0',lifespan=lifespan)
app.add_middleware(CORSMiddleware,allow_origins=[x.strip() for x in os.getenv('CORS_ORIGINS','http://localhost:3000,http://127.0.0.1:3000').split(',')],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
def get_db():
    with SessionLocal() as db: yield db
def user_or_404(db,id):
    if not db.get(User,id): raise HTTPException(404,'User not found')
def listing_or_404(db,id):
    l=db.get(Listing,id)
    if not l: raise HTTPException(404,'Listing not found')
    return l
def serialize(l,detail=False):
    result={k:getattr(l,k) for k in ['id','host_id','title','description','location','country','category','price','max_guests','bedrooms','beds','baths','rating']}
    result.update(photos=json.loads(l.photos_json),amenities=json.loads(l.amenities_json),host={'id':l.host.id,'name':l.host.name,'avatar':l.host.avatar})
    if detail:
        result['booked_dates']=[{'check_in':b.check_in.isoformat(),'check_out':b.check_out.isoformat()} for b in l.bookings if b.status=='confirmed']
        result['reviews']=[{'id':r.id,'author':r.author,'body':r.body,'rating':r.rating} for r in l.reviews]
    return result
def booking_out(b):
    return {'id':b.id,'listing_id':b.listing_id,'guest_id':b.guest_id,'check_in':b.check_in.isoformat(),'check_out':b.check_out.isoformat(),'guests':b.guests,'total':b.total,'status':b.status,'listing':serialize(b.listing)}
@app.get('/api/health')
def health(): return {'status':'ok'}
@app.get('/api/users')
def users(db:Session=Depends(get_db)): return [{'id':u.id,'name':u.name,'avatar':u.avatar} for u in db.scalars(select(User)).all()]
@app.get('/api/listings')
def listings(q:str='',category:str='',min_price:Optional[float]=None,max_price:Optional[float]=None,guests:int=1,check_in:Optional[date]=None,check_out:Optional[date]=None,page:int=Query(1,ge=1),limit:int=Query(12,ge=1,le=48),amenities:str='',db:Session=Depends(get_db)):
    stmt=select(Listing)
    if q: stmt=stmt.where((Listing.location.ilike(f'%{q}%'))|(Listing.country.ilike(f'%{q}%'))|(Listing.title.ilike(f'%{q}%')))
    if category and category!='All': stmt=stmt.where(Listing.category==category)
    if min_price is not None: stmt=stmt.where(Listing.price>=min_price)
    if max_price is not None: stmt=stmt.where(Listing.price<=max_price)
    stmt=stmt.where(Listing.max_guests>=guests)
    if check_in and check_out:
        if check_in>=check_out: raise HTTPException(422,'Invalid date range')
        occupied=select(Booking.listing_id).where(Booking.status=='confirmed',Booking.check_in<check_out,Booking.check_out>check_in)
        stmt=stmt.where(~Listing.id.in_(occupied))
    for amenity in [a for a in amenities.split(',') if a]: stmt=stmt.where(Listing.amenities_json.contains('"'+amenity+'"'))
    matches=db.scalars(stmt.order_by(Listing.id.desc()).options(selectinload(Listing.host))).all()
    return {'items':[serialize(l) for l in matches[(page-1)*limit:page*limit]],'total':len(matches),'page':page,'pages':max(1,(len(matches)+limit-1)//limit)}
@app.get('/api/listings/{listing_id}')
def get_listing(listing_id:int,db:Session=Depends(get_db)):
    l=db.scalar(select(Listing).where(Listing.id==listing_id).options(selectinload(Listing.host),selectinload(Listing.bookings),selectinload(Listing.reviews)))
    if not l: raise HTTPException(404,'Listing not found')
    return serialize(l,True)
@app.post('/api/listings',status_code=201)
def create_listing(body:ListingInput,user_id:int=2,db:Session=Depends(get_db)):
    user_or_404(db,user_id)
    l=Listing(host_id=user_id,**body.model_dump(exclude={'photos','amenities'}),photos_json=json.dumps(body.photos),amenities_json=json.dumps(body.amenities),rating=5.0)
    db.add(l);db.commit();db.refresh(l)
    return serialize(l)
@app.put('/api/listings/{listing_id}')
def update_listing(listing_id:int,body:ListingInput,user_id:int=2,db:Session=Depends(get_db)):
    l=listing_or_404(db,listing_id)
    if l.host_id!=user_id: raise HTTPException(403,'Only the owner can edit this listing')
    for k,v in body.model_dump(exclude={'photos','amenities'}).items():setattr(l,k,v)
    l.photos_json=json.dumps(body.photos);l.amenities_json=json.dumps(body.amenities)
    db.commit();db.refresh(l);return serialize(l)
@app.delete('/api/listings/{listing_id}')
def delete_listing(listing_id:int,user_id:int=2,db:Session=Depends(get_db)):
    l=listing_or_404(db,listing_id)
    if l.host_id!=user_id: raise HTTPException(403,'Only the owner can delete this listing')
    db.delete(l);db.commit();return {'ok':True}
@app.post('/api/bookings',status_code=201)
def book(body:BookingInput,user_id:int=1,db:Session=Depends(get_db)):
    user_or_404(db,user_id)
    # SQLite BEGIN IMMEDIATE serializes writers, preventing concurrent overlapping reservations.
    db.connection().exec_driver_sql('BEGIN IMMEDIATE') if DB_URL.startswith('sqlite') else None
    l=listing_or_404(db,body.listing_id)
    if body.guests>l.max_guests: raise HTTPException(422,'Guest count exceeds capacity')
    if l.host_id==user_id: raise HTTPException(403,'Cannot book your own listing')
    conflict=db.scalar(select(Booking.id).where(Booking.listing_id==l.id,Booking.status=='confirmed',Booking.check_in<body.check_out,Booking.check_out>body.check_in).limit(1))
    if conflict: raise HTTPException(409,'Those dates are no longer available')
    nights=(body.check_out-body.check_in).days
    b=Booking(listing_id=l.id,guest_id=user_id,check_in=body.check_in,check_out=body.check_out,guests=body.guests,total=round(l.price*nights*1.12,2))
    db.add(b);db.commit();db.refresh(b)
    return booking_out(b)
@app.get('/api/bookings')
def bookings(user_id:int=1,db:Session=Depends(get_db)):
    user_or_404(db,user_id)
    return [booking_out(b) for b in db.scalars(select(Booking).where(Booking.guest_id==user_id).options(selectinload(Booking.listing).selectinload(Listing.host)).order_by(Booking.id.desc())).all()]
@app.get('/api/host/dashboard')
def host_dashboard(user_id:int=2,db:Session=Depends(get_db)):
    user_or_404(db,user_id)
    mine=db.scalars(select(Listing).where(Listing.host_id==user_id).options(selectinload(Listing.host),selectinload(Listing.bookings).selectinload(Booking.guest))).all()
    return {'listings':[serialize(l) for l in mine], 'bookings':[{'id':b.id,'listing_id':l.id,'title':l.title,'guest':b.guest.name,'check_in':b.check_in.isoformat(),'check_out':b.check_out.isoformat(),'total':b.total} for l in mine for b in l.bookings]}
@app.get('/api/favorites')
def favorites(user_id:int=1,db:Session=Depends(get_db)):
    return [r[0] for r in db.execute(select(Favorite.listing_id).where(Favorite.user_id==user_id)).all()]
@app.post('/api/favorites/{listing_id}')
def toggle_favorite(listing_id:int,user_id:int=1,db:Session=Depends(get_db)):
    user_or_404(db,user_id);listing_or_404(db,listing_id)
    f=db.get(Favorite,{'user_id':user_id,'listing_id':listing_id})
    if f:db.delete(f)
    else:db.add(Favorite(user_id=user_id,listing_id=listing_id))
    db.commit();return {'favorited':not bool(f)}
