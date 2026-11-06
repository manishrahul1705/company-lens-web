import "./globals.css"
import {Inter, Fraunces} from 'next/font/google';
const inter = Inter({subsets:['latin'],weight:['400','500','600'],variable:'--font-ui',display:'swap',preload:true});
const fraunces = Fraunces({subsets:['latin'],weight:['600'],variable:'--font-editorial',display:'swap',preload:true});
import {Suspense} from 'react';
import { LensProvider } from '@/components/lens-provider';
import { LensShell } from '@/components/lens-shell';
export const metadata = { manifest:'/manifest.webmanifest', appleWebApp:{capable:true,title:'Nordic Company Lens'}, openGraph:{title:'Nordic Company Lens',description:'Look up Norwegian companies and trace the facts to their source.',type:'website'}, twitter:{card:'summary_large_image',title:'Nordic Company Lens'}, title: 'Nordic Company Lens', description: 'Look up Norwegian companies and trace the facts to their source.', icons: { icon: 'https://keystone.jboxai.com/project-assets/ohpazwitpsg6lbbg6r4u7w0q/bd19i6l7vvaujtqcj6vxuvx3/64aa2ebdcd8543e0f840701a7da3f5a989e30feb0d42661e57328395247d17a3/64aa2ebdcd8543e0.svg' } }; 

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <Suspense fallback={<><header className="site-header"><div className="container header-inner"><a href="/" className="brand">Nordic Company Lens</a><nav className="nav-links"><a href="/compare">Compare</a></nav></div></header><main aria-label="Loading" aria-busy="true"><div className="container skeleton-state"><label className="search-field home-search"><span className="sr-only">Search companies</span><input placeholder="Search by name, org. number, town or industry" aria-label="Search companies" readOnly/></label><div role="status"><span className="sr-only">Loading company records</span><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div></div></main></>}><LensProvider><LensShell>{children}</LensShell></LensProvider></Suspense>
      </body>
    </html>
  )
}
