'use client';
import Link from 'next/link';
import {useLensData} from '@/components/lens-provider';
export default function NotFound(){const {language,t}=useLensData();return <div className="empty-state"><p className="eyebrow">{language==='no'?'Siden ble ikke funnet':'Page Not Found'}</p><h1>{language==='no'?'Tilbake til fakta.':'Let’s Get You Back to the Facts.'}</h1><p>{language==='no'?'Denne siden ble ikke funnet.':'This page could not be found.'}</p><Link className="button" href="/">{t('Search Companies')}</Link></div>;}
