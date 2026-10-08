'use client';
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import {api} from '@/lib/api';
type User={id:number;name:string;avatar:string};
type Context={user:User;setUserId:(id:number)=>void;toast:(msg:string)=>void;favorites:number[];toggleFavorite:(id:number)=>void};
const C=createContext<Context|null>(null);
export function useApp(){const v=useContext(C);if(!v)throw Error('Missing app provider');return v}
export default function Providers({children}:{children:ReactNode}){
 const [users,setUsers]=useState<User[]>([{id:1,name:'Alex Morgan',avatar:''},{id:2,name:'Sofia Patel',avatar:''},{id:3,name:'Jamie Rivera',avatar:''}]);const [id,setId]=useState(1);const [notice,setNotice]=useState('');const [favorites,setFavorites]=useState<number[]>([]);
 useEffect(()=>{api<User[]>('/api/users').then(setUsers).catch(()=>{});const v=Number(localStorage.getItem('staybnb-user'));if([1,2,3].includes(v))setId(v)},[]);
 useEffect(()=>{api<number[]>(`/api/favorites?user_id=${id}`).then(setFavorites).catch(()=>{})},[id]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(t)},[notice]);
 const toggleFavorite=async(listing:number)=>{try{const r=await api<{favorited:boolean}>(`/api/favorites/${listing}?user_id=${id}`,{method:'POST'});setFavorites(f=>r.favorited?[...f,listing]:f.filter(x=>x!==listing));setNotice(r.favorited?'Saved to wishlist':'Removed from wishlist')}catch(e){setNotice((e as Error).message)}};
 const setUserId=(n:number)=>{setId(n);localStorage.setItem('staybnb-user',String(n))};
 return <C.Provider value={{user:users.find(u=>u.id===id)||users[0],setUserId,toast:setNotice,favorites,toggleFavorite}}>{children}{notice&&<div role="status" className="toast">✓ &nbsp;{notice}</div>}</C.Provider>
}
