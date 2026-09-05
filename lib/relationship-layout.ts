export interface LayoutPoint { x: number; y: number }

const shorten=(from:LayoutPoint,to:LayoutPoint,amount:number)=>{const dx=to.x-from.x,dy=to.y-from.y,length=Math.max(1,Math.hypot(dx,dy));return{x:from.x+dx/length*amount,y:from.y+dy/length*amount}};
const segmentHitsRect=(a:LayoutPoint,b:LayoutPoint,rect:{left:number;right:number;top:number;bottom:number})=>a.x===b.x?a.x>rect.left&&a.x<rect.right&&Math.max(a.y,b.y)>rect.top&&Math.min(a.y,b.y)<rect.bottom:a.y===b.y&&a.y>rect.top&&a.y<rect.bottom&&Math.max(a.x,b.x)>rect.left&&Math.min(a.x,b.x)<rect.right;

export function routeAroundNodes(sourceId:string,targetId:string,positions:Record<string,LayoutPoint>):LayoutPoint[]{
  const source={x:positions[sourceId].x+58,y:positions[sourceId].y+26},target={x:positions[targetId].x+58,y:positions[targetId].y+26};
  const obstacles=Object.entries(positions).filter(([id])=>id!==sourceId&&id!==targetId).map(([,p])=>({left:p.x-18,right:p.x+134,top:p.y-18,bottom:p.y+106}));
  const blocked=(a:LayoutPoint,b:LayoutPoint)=>obstacles.some(rect=>segmentHitsRect(a,b,rect));
  const directBlocked=obstacles.some(rect=>{const steps=Math.max(2,Math.ceil(Math.hypot(target.x-source.x,target.y-source.y)/18));return Array.from({length:steps-1},(_,i)=>{const t=(i+1)/steps,x=source.x+(target.x-source.x)*t,y=source.y+(target.y-source.y)*t;return x>rect.left&&x<rect.right&&y>rect.top&&y<rect.bottom}).some(Boolean)});
  if(!directBlocked)return[shorten(source,target,27),shorten(target,source,27)];
  const xCandidates=[(source.x+target.x)/2,...obstacles.flatMap(r=>[r.left,r.right]),Math.min(...obstacles.map(r=>r.left))-24,Math.max(...obstacles.map(r=>r.right))+24];
  const yCandidates=[(source.y+target.y)/2,...obstacles.flatMap(r=>[r.top,r.bottom]),Math.min(...obstacles.map(r=>r.top))-24,Math.max(...obstacles.map(r=>r.bottom))+24];
  const candidates=[...xCandidates.map(x=>[source,{x,y:source.y},{x,y:target.y},target]),...yCandidates.map(y=>[source,{x:source.x,y},{x:target.x,y},target])];
  const length=(path:LayoutPoint[])=>path.slice(1).reduce((sum,p,i)=>sum+Math.abs(p.x-path[i].x)+Math.abs(p.y-path[i].y),0);
  const valid=candidates.filter(path=>path.slice(1).every((point,index)=>!blocked(path[index],point))).sort((a,b)=>length(a)-length(b));
  if(!valid.length)return[shorten(source,target,27),shorten(target,source,27)];
  const simple=valid[0].filter((point,i,path)=>i===0||i===path.length-1||(path[i-1].x===point.x)!==(point.x===path[i+1].x));
  simple[0]=shorten(source,simple[1]||target,27);simple[simple.length-1]=shorten(target,simple.at(-2)||source,27);return simple;
}
