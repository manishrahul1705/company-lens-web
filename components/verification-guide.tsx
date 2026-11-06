'use client';

import Link from 'next/link';
import {useLensData} from '@/components/lens-provider';
import styles from './verification-guide.module.css';

export function VerificationGuide(){
  const {language}=useLensData();
  const local=(en:string,no:string)=>language==='no'?no:en;
  const steps=[
    local('Registry','Register'),
    local('Candidate site','Mulig nettside'),
    local('Proof on page','Bevis på siden'),
    local('Published fact','Publisert opplysning'),
  ];
  return <article className={styles['verification-guide']} lang={language==='no'?'nb':'en'}>
    <header className={styles['verification-heading']}>
      <p className="eyebrow">{local('The evidence behind the facts','Bevisene bak opplysningene')}</p>
      <h1>{local('How we verify','Slik verifiserer vi')}</h1>
      <p>{local('A company name is a starting point, not proof. We keep the source and the evidence visible so you can check the connection yourself.','Et selskapsnavn er et utgangspunkt, ikke et bevis. Vi viser kilden og dokumentasjonen slik at du selv kan kontrollere sammenhengen.')}</p>
    </header>

    <section className={styles['verification-flow']} aria-labelledby="verification-flow-title">
      <h2 id="verification-flow-title">{local('From a record to a sourced fact','Fra registeroppføring til kildebelagt opplysning')}</h2>
      <ol className={styles['verification-steps']}>
        {steps.map((step,index)=><li key={step}><span className={styles['verification-step-number']} aria-hidden="true">{index+1}</span><span>{step}</span>{index<steps.length-1&&<span className={styles['verification-arrow']} aria-hidden="true">→</span>}</li>)}
      </ol>
    </section>

    <div className={styles['verification-sections']}>
      <section>
        <h2>{local('Start with the registry','Vi starter i registeret')}</h2>
        <p>{local('Registry facts come from Brønnøysundregistrene, the Norwegian business registers. The organisation number identifies the legal company; names alone can be similar or change over time.','Registeropplysninger kommer fra Brønnøysundregistrene. Organisasjonsnummeret identifiserer det juridiske selskapet; navn kan ligne på hverandre eller endres over tid.')}</p>
        <p><a href="https://data.brreg.no/enhetsregisteret/api/dokumentasjon/no/" target="_blank" rel="noopener noreferrer">{local('Read about the Brønnøysund registry source','Les om registerkilden hos Brønnøysundregistrene')}</a></p>
      </section>
      <section>
        <h2>{local('A website needs its own proof','En nettside må ha egne bevis')}</h2>
        <p>{local('A matching name or a likely domain is not enough. A website counts as verified only when the company’s organisation number appears on the site, or when its legal name and registered contact details appear together. We keep a quote from the page so the match can be inspected.','Et samsvarende navn eller et sannsynlig domene er ikke nok. En nettside regnes som verifisert bare når selskapets organisasjonsnummer står på siden, eller når det juridiske navnet og registrerte kontaktopplysninger står der sammen. Vi beholder et sitat fra siden slik at koblingen kan kontrolleres.')}</p>
        <aside className={styles['verification-example']} aria-labelledby="verification-example-title">
          <p className="eyebrow" id="verification-example-title">{local('A real example · Vokser AS','Et ekte eksempel · Vokser AS')}</p>
          <blockquote>“Org. nr. 919 653 477”</blockquote>
          <p>{local('This quote from Vokser’s website matches Vokser AS’s organisation number, 919653477. It is evidence linking this site to this legal company—not an endorsement of its services.','Dette sitatet fra Voksers nettside samsvarer med organisasjonsnummeret til Vokser AS, 919653477. Det dokumenterer koblingen mellom nettsiden og det juridiske selskapet – ikke en anbefaling av tjenestene.')}</p>
          <div className={styles['verification-example-links']}>
            <a href="https://vokser.no/" target="_blank" rel="noopener noreferrer">{local('Read the original page at vokser.no','Les originalsiden på vokser.no')}</a>
            <Link href="/company?org=919653477">{local('Inspect Vokser’s company record','Se selskapsopplysningene for Vokser')}</Link>
          </div>
        </aside>
      </section>
      <section>
        <h2>{local('Shared sites need a company-specific match','Delte nettsider krever en entydig kobling')}</h2>
        <p>{local('A group website may describe several companies. Group and shared sites are withheld unless the page shows this company’s own organisation number. A parent company’s number does not establish that the site belongs to a subsidiary.','Et konsernnettsted kan omtale flere selskaper. Konsernnettsteder og delte nettsider holdes tilbake med mindre siden viser dette selskapets eget organisasjonsnummer. Morselskapets nummer dokumenterer ikke at nettsiden tilhører et datterselskap.')}</p>
      </section>
      <section>
        <h2>{local('Gaps stay visible','Mangler forblir synlige')}</h2>
        <p>{local('Found, not found and couldn’t check mean different things. Not found means the checked source did not provide the information. Couldn’t check means we could not complete the check—for example, a source was unavailable or access was blocked. Ambiguous matches are withheld.','Funnet, ikke funnet og kunne ikke kontrolleres betyr forskjellige ting. Ikke funnet betyr at den kontrollerte kilden ikke ga opplysningen. Kunne ikke kontrolleres betyr at kontrollen ikke kunne fullføres – for eksempel fordi kilden var utilgjengelig eller tilgangen var blokkert. Tvetydige koblinger holdes tilbake.')}</p>
        <p>{local('We never fill a gap with a guess. Missing evidence does not prove that a company has no website, jobs or other activity. Check the source, quotation and retrieval date attached to each published fact.','Vi fyller aldri et hull med en gjetning. Manglende dokumentasjon beviser ikke at selskapet mangler nettside, stillinger eller annen aktivitet. Kontroller kilden, sitatet og innhentingsdatoen som følger hver publiserte opplysning.')}</p>
      </section>
    </div>
    <footer className={styles['verification-return']}><Link className="button secondary" href="/">{local('Search companies','Søk etter selskaper')}</Link></footer>
  </article>;
}
