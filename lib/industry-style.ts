import {text,type Company} from './lens-data';

/** Presentation grouping only: never changes the source industry label or record. */
export function industryGroup(company:Company):string {
  const description=`${text(company.industry_text_en)} ${text(company.industry_text)}`.toLocaleLowerCase('nb-NO');
  // Specific text wins over broad NACE divisions (notably holding companies).
  if (/holding|finance|financial|finans|bank|insurance|forsikring|investment|investering/.test(description)) return 'finance';
  if (/real estate|eiendom|property/.test(description)) return 'realestate';
  if (/software|programmer|programvare|information technology|informasjonsteknologi|it-konsulent|data processing|databehandling|telekommun|telecommun/.test(description)) return 'tech';
  if (/construction|building|bygg|anlegg|carpentry|snekker|electrical installation|elektroinstall|plumbing|rørlegger/.test(description)) return 'construction';
  if (/energy|energi|electricity|kraft|utilities|water supply|vannforsyn|renewable|fornybar|petroleum|oil and gas/.test(description)) return 'energy';
  if (/health|helse|medical|medisin|hospital|sykehus|lege|dental|tannlege|care services|omsorg/.test(description)) return 'health';
  if (/retail|wholesale|butikk|detaljhandel|engroshandel|varehandel/.test(description)) return 'retail';
  if (/education|undervisning|skole|culture|kultur|museum|arts|kunst|theatre|teater|publishing|forlag/.test(description)) return 'culture';
  const match=text(company.industry_code).match(/^(\d{2})/);
  const code=match?Number(match[1]):NaN;
  if (code>=41&&code<=43) return 'construction';
  if (code>=61&&code<=63) return 'tech';
  if (code===68) return 'realestate';
  if (code===6||(code>=35&&code<=39)) return 'energy';
  if (code>=86&&code<=88) return 'health';
  if (code>=64&&code<=66) return 'finance';
  if (code>=45&&code<=47) return 'retail';
  if (code===58||code===59||code===60||code===85||(code>=90&&code<=91)) return 'culture';
  return 'other';
}
