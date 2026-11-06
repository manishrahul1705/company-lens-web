import "./globals.css"
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
    <html lang="en">
      <body>
        <Suspense fallback={<main aria-label="Loading"><div className="container skeleton-state"><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div></main>}><LensProvider><LensShell>{children}</LensShell></LensProvider></Suspense>
      </body>
    </html>
  )
}
