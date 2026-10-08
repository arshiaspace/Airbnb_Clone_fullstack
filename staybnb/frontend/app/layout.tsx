import './globals.css';import Header from '@/components/Header';import Providers from '@/components/Providers';
export const metadata={title:'Staybnb | Find your next stay',description:'Browse unique stays, plan trips and welcome guests.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Providers><Header/>{children}<footer className="footer">© 2026 Staybnb, Inc. · An independently built educational marketplace demo <span>Privacy · Terms · Support</span></footer></Providers></body></html>}
