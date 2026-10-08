'use client';
import {useState} from 'react';
import {ChevronLeft,ChevronRight,CalendarDays} from 'lucide-react';

type Reserved={check_in:string;check_out:string};
type Props={checkIn:string;checkOut:string;onChange:(start:string,end:string)=>void;booked:Reserved[]};
const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>iso(new Date());
const nextMonth=(d:Date,n:number)=>new Date(d.getFullYear(),d.getMonth()+n,1);
const longDate=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'});
export default function AvailabilityCalendar({checkIn,checkOut,onChange,booked}:Props){
 const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const [open,setOpen]=useState(false);
 const occupied=(date:string)=>booked.some(b=>date>=b.check_in&&date<b.check_out);
 const isRangeFree=(start:string,end:string)=>{
  const pointer=new Date(`${start}T12:00:00`),finish=new Date(`${end}T12:00:00`);
  while(pointer<finish){if(occupied(iso(pointer)))return false;pointer.setDate(pointer.getDate()+1)}
  return true;
 };
 const choose=(day:string)=>{
  if(day<today()||occupied(day))return;
  if(!checkIn||checkOut||day<=checkIn){onChange(day,'');return}
  if(!isRangeFree(checkIn,day)){onChange(day,'');return}
  onChange(checkIn,day);setOpen(false);
 };
 const renderMonth=(start:Date)=>{
  const year=start.getFullYear(),m=start.getMonth(),offset=new Date(year,m,1).getDay(),num=new Date(year,m+1,0).getDate();
  return <div className="calMonth" key={`${year}-${m}`}><h3>{start.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h3><div className="calDays">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(x=><span className="calWeek" key={x}>{x}</span>)}{Array.from({length:offset},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:num},(_,i)=>{
   const day=iso(new Date(year,m,i+1)),blocked=day<today()||occupied(day),selected=day===checkIn||day===checkOut,inRange=!!(checkIn&&checkOut&&day>checkIn&&day<checkOut);
   return <button type="button" title={blocked?'Unavailable':day} aria-label={`${day}${blocked?' unavailable':''}`} aria-pressed={selected} className={`calDay ${blocked?'calBlocked':''} ${selected?'calSelected':''} ${inRange?'calInRange':''}`} disabled={blocked} key={day} onClick={()=>choose(day)}>{i+1}</button>
  })}</div></div>
 };
 return <div className="availabilityRoot"><button type="button" className="dateTrigger" onClick={()=>setOpen(x=>!x)} aria-expanded={open}><CalendarDays size={17}/><span>{checkIn?longDate(checkIn):'Check-in'} <span className="muted">→</span> {checkOut?longDate(checkOut):'Checkout'}</span></button>
 {open&&<div className="calPopup"><div className="calHeader"><div><strong>Select your dates</strong><small>{checkIn&&!checkOut?'Now choose a checkout date':'Unavailable dates are disabled'}</small></div><div><button type="button" aria-label="Previous month" disabled={month.getFullYear()===new Date().getFullYear()&&month.getMonth()===new Date().getMonth()} onClick={()=>setMonth(x=>nextMonth(x,-1))}><ChevronLeft/></button><button type="button" aria-label="Next month" onClick={()=>setMonth(x=>nextMonth(x,1))}><ChevronRight/></button></div></div><div className="calMonths">{renderMonth(month)}{renderMonth(nextMonth(month,1))}</div><div className="calFooter"><button type="button" onClick={()=>onChange('','')}>Clear dates</button><button type="button" onClick={()=>setOpen(false)}>Close</button></div></div>}
 </div>;
}
