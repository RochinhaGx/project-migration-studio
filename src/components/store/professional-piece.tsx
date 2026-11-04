import { Center, Text3D } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import { Shape, ExtrudeGeometry } from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import symbolAsset from '@/assets/professional-symbol.stl.asset.json';
import baseAsset from '@/assets/professional-base.stl.asset.json';

const fontText = (text: string, font: string, size: number, color: string, depth: number) => <Text3D font={font} size={size} height={depth} curveSegments={6}>{text || ' '}<meshStandardMaterial color={color}/></Text3D>;
function SuppliedBase({width,color}:{width:number;color:string}) {
  const original=useLoader(STLLoader,baseAsset.url);
  const geometry=useMemo(()=>{const g=original.clone();g.center();return g;},[original]);
  return <mesh geometry={geometry} position={[0,-1.4,0]} rotation={[-Math.PI/2,0,0]} scale={[width/238.727,0.08,0.06]}><meshStandardMaterial color={color}/></mesh>;
}
function SuppliedSymbol({color}:{color:string}) {
  const original=useLoader(STLLoader,symbolAsset.url);
  const geometry=useMemo(()=>{const g=original.clone();g.center();return g;},[original]);
  return <mesh geometry={geometry} position={[-4.3,0.3,0]} scale={0.07}><meshStandardMaterial color={color}/></mesh>;
}
function Symbol({kind,color}:{kind:string;color:string}) {
  const g=useMemo(()=>{
    const s=new Shape();
    if(kind==='dentist'){s.moveTo(-0.7,0.9);s.bezierCurveTo(-1.4,1.8,-1.7,0,-0.8,-0.4);s.lineTo(-0.5,-1.5);s.lineTo(0,-0.6);s.lineTo(0.5,-1.5);s.lineTo(0.8,-0.4);s.bezierCurveTo(1.7,0,1.4,1.8,0.7,0.9);s.lineTo(0,0.7);}
    else if(kind==='chef'){s.moveTo(-0.9,-0.9);s.lineTo(0.9,-0.9);s.lineTo(0.9,0.4);s.bezierCurveTo(1.8,0.5,1.6,1.5,0.7,1.3);s.bezierCurveTo(0.5,2,-0.5,2,-0.7,1.3);s.bezierCurveTo(-1.6,1.5,-1.8,0.5,-0.9,0.4);}
    else if(kind==='engineer'||kind==='maker'){for(let i=0;i<40;i++){const a=i*Math.PI/20;const r=i%4<2?1.3:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}}
    else {s.moveTo(-0.4,-1.4);s.lineTo(0.4,-1.4);s.lineTo(0.4,-0.4);s.lineTo(1.4,-0.4);s.lineTo(1.4,0.4);s.lineTo(0.4,0.4);s.lineTo(0.4,1.4);s.lineTo(-0.4,1.4);s.lineTo(-0.4,0.4);s.lineTo(-1.4,0.4);s.lineTo(-1.4,-0.4);s.lineTo(-0.4,-0.4);}
    s.closePath();return new ExtrudeGeometry(s,{depth:0.2,bevelEnabled:false});
  },[kind]);
  if(kind==='psychologist')return <Suspense fallback={null}><SuppliedSymbol color={color}/></Suspense>;
  if(kind==='lawyer')return <group position={[-4.3,0.2,0]}><mesh><boxGeometry args={[0.12,2.7,0.25]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,0.8,0]}><boxGeometry args={[2.5,0.12,0.25]}/><meshStandardMaterial color={color}/></mesh>{[-1,1].map(x=><group key={x} position={[x,0.2,0]}><mesh><boxGeometry args={[0.07,1.1,0.2]}/><meshStandardMaterial color={color}/></mesh><mesh position={[0,-0.6,0]}><boxGeometry args={[0.9,0.15,0.4]}/><meshStandardMaterial color={color}/></mesh></group>)}</group>;
  return <mesh geometry={g} position={[-4.3,0.2,0]}><meshStandardMaterial color={color}/></mesh>;
}
export function ProfessionalPiece({kind,text,title,font,size,spacing,textColor,baseColor,symbolColor,depth,thick}:{kind:string;text:string;title:string;font:string;size:number;spacing:number;textColor:string;baseColor:string;symbolColor:string;depth:number;thick:number}) {
  const lines=text.trim().split(/\n/).slice(0,2);if(lines.length===1&&lines[0]?.includes(' ')){const words=lines[0].split(' ');lines.splice(0,1,words.slice(0,Math.ceil(words.length/2)).join(' '),words.slice(Math.ceil(words.length/2)).join(' '));}
  const width=Math.max(8,Math.max(...lines.map(x=>x.length))*size*0.85+4);
  if(kind==='wavy-letters')return <group><mesh position={[0,-1,0]}><boxGeometry args={[width,0.35,3.5*thick]}/><meshStandardMaterial color={baseColor}/></mesh>{Array.from({length:7},(_,i)=><Center key={i} position={[Math.sin(i*0.8)*0.25,0,i*0.45-1.4]}>{fontText(text,font,size,textColor,0.12*depth)}</Center>)}</group>;
  if(kind==='speech-bubble')return <group><mesh><boxGeometry args={[width,2.4*size,0.35*thick]}/><meshStandardMaterial color={baseColor}/></mesh><mesh position={[-width/3,-1.25*size,0]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[0.7,0.7,0.35*thick]}/><meshStandardMaterial color={baseColor}/></mesh><Center position={[0,0,0.25]}>{fontText(text,font,size,textColor,0.18*depth)}</Center></group>;
  return <group scale={size}><Suspense fallback={null}><SuppliedBase width={width/size} color={baseColor}/></Suspense><Symbol kind={kind} color={symbolColor}/>{lines.map((line,i)=><Center key={i} position={[0.7,0.65-i*1.05,0]}><Text3D font={font} size={0.9} height={0.35*depth} letterSpacing={spacing} curveSegments={6}>{line || ' '}<meshStandardMaterial color={textColor}/></Text3D></Center>)}<Center position={[0,-1.4,0.65]}>{fontText(title,font,0.28,symbolColor,0.07*depth)}</Center></group>;
}