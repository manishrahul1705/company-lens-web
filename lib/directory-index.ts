import {categories,type Company} from './lens-data';
export type CompactIndex={fields:string[];dictionaries:Record<string,unknown[]>;rows:unknown[][]};
export function expandIndex(index:CompactIndex):Company[]{return index.rows.map(row=>{const c:Record<string,unknown>={};index.fields.forEach((key,i)=>{const v=row[i];c[key]=key==='sections'?Object.fromEntries(categories.map((k,j)=>[k,['available','not_found','source_error','blocked'][Number(String(v)[j])]])):index.dictionaries[key]?index.dictionaries[key][Number(v)]:v;});return c as Company;});}
