import {ImageResponse} from 'next/og';
export const alt='Nordic Company Lens — Norwegian companies. Every fact traced to its source.';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',background:'#f6f8f7',color:'#142d27',padding:80,flexDirection:'column',justifyContent:'space-between',fontFamily:'sans-serif'}}><div style={{fontSize:26,color:'#087f5b'}}>Nordic Company Lens</div><div style={{display:'flex',flexDirection:'column',fontSize:66,letterSpacing:-3}}><span>Norwegian companies.</span><span style={{color:'#087f5b'}}>Every fact traced to its source.</span></div><div style={{display:'flex',fontSize:23,borderTop:'1px solid #c7d7ce',paddingTop:24}}>Find → Compare → Check the source</div></div>,size);}
