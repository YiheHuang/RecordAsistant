import type { Milestone, Project, Task, WorkbenchData } from './workbench-types';

export const today = () => { const d=new Date(); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000); return local.toISOString().slice(0,10); };
export const datePart = (value: string) => value.slice(0,10);
export const localDateTime = (date: Date) => { const local=new Date(date.getTime()-date.getTimezoneOffset()*60000); return local.toISOString().slice(0,16); };
export const nextWholeHour = (from=new Date()) => { const next=new Date(from); next.setMinutes(0,0,0); next.setHours(next.getHours()+1); return localDateTime(next); };
export const nextMidnightAfter = (value:string|Date=nextWholeHour()) => { const start=typeof value==='string'?new Date(value):new Date(value); if(Number.isNaN(start.getTime())) return ''; const end=new Date(start); end.setHours(24,0,0,0); return localDateTime(end); };
export const dateValue = (value:string) => new Date(value.includes('T')?value:`${value}T23:59:59`);
export const daysFromToday = (value: string) => Math.ceil((dateValue(value).getTime() - Date.now()) / 86400000);
export const isPast = (value:string) => !!value&&dateValue(value).getTime()<Date.now();
export function milestoneProgress(milestoneId: string, tasks: Task[]) { const list=tasks.filter(t=>t.milestoneId===milestoneId); const total=list.reduce((n,t)=>n+t.weight,0); return total ? Math.round(list.filter(t=>t.completed).reduce((n,t)=>n+t.weight,0)/total*100) : 0; }
export function projectProgress(projectId: string, tasks: Task[]) { const list=tasks.filter(t=>t.projectId===projectId); const total=list.reduce((n,t)=>n+t.weight,0); return total ? Math.round(list.filter(t=>t.completed).reduce((n,t)=>n+t.weight,0)/total*100) : 0; }
export function projectRisk(project: Project, milestones: Milestone[], tasks: Task[]) { return project.status==='进行中' && (tasks.some(t=>t.projectId===project.id&&!t.completed&&isPast(t.dueDate)) || milestones.some(m=>m.projectId===project.id&&m.status!=='已完成'&&isPast(m.targetDate))); }
export const relationshipAverage = (scores:{trust:number;collaboration:number;familiarity:number;influence:number}) => (scores.trust+scores.collaboration+scores.familiarity+scores.influence)/4;
export function stripLinksForDeleted(data:WorkbenchData, kind:'project'|'person'|'relationship', id:string):WorkbenchData {
  const events=data.events.map(e=>({...e, projectIds:kind==='project'?e.projectIds.filter(x=>x!==id):e.projectIds, personIds:kind==='person'?e.personIds.filter(x=>x!==id):e.personIds, relationshipIds:kind==='relationship'?e.relationshipIds.filter(x=>x!==id):e.relationshipIds}));
  if(kind==='project') return {...data,projects:data.projects.filter(x=>x.id!==id),milestones:data.milestones.filter(x=>x.projectId!==id),tasks:data.tasks.filter(x=>x.projectId!==id),relationships:data.relationships.map(r=>({...r,events:r.events.map(x=>x.projectId===id?{...x,projectId:undefined}:x)})),events};
  if(kind==='person') { const relIds=data.relationships.filter(r=>r.personAId===id||r.personBId===id).map(r=>r.id); return {...data,persons:data.persons.filter(x=>x.id!==id),relationships:data.relationships.filter(r=>!relIds.includes(r.id)),events:events.map(e=>({...e,relationshipIds:e.relationshipIds.filter(x=>!relIds.includes(x))}))}; }
  return {...data,relationships:data.relationships.filter(x=>x.id!==id),events};
}
