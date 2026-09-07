import Dexie, { type Table } from 'dexie';
import type { BackupPayload, Milestone, Person, Project, Relationship, Settings, Task, WorkbenchData, WorkbenchEvent } from './workbench-types';

class WorkbenchDB extends Dexie {
  projects!: Table<Project, string>; milestones!: Table<Milestone, string>; tasks!: Table<Task, string>;
  persons!: Table<Person, string>; relationships!: Table<Relationship, string>; events!: Table<WorkbenchEvent, string>; settings!: Table<Settings & { id: string }, string>;
  constructor() {
    super('doctoral-workbench');
    this.version(1).stores({ projects: 'id,status,endDate,*tags', milestones: 'id,projectId,targetDate,status', tasks: 'id,projectId,milestoneId,dueDate,completed', persons: 'id,isSelf,*tags', relationships: 'id,personAId,personBId', events: 'id,date,category,importance,*projectIds,*personIds,*relationshipIds', settings: 'id' });
  }
}

export const db = new WorkbenchDB();
export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const iso = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000); return local.toISOString().slice(0, 10); };
const isoTime = (offset=0,hour=0,minute=0) => { const d=new Date(); d.setDate(d.getDate()+offset); d.setHours(hour,minute,0,0); const local=new Date(d.getTime()-d.getTimezoneOffset()*60000); return local.toISOString().slice(0,16); };
const withTime=(value:string|undefined,time:string)=>!value?'':value.includes('T')?value:`${value}T${time}`;
export const normalizeData=(data:WorkbenchData):WorkbenchData=>({...data,
  projects:data.projects.map(project=>({...project,startDate:withTime(project.startDate,'00:00'),endDate:withTime(project.endDate,'23:59')})),
  tasks:data.tasks.map(task=>{const legacy=task as Task&{startDate?:string};const dueDate=task.dueDate||'';return{...task,startDate:withTime(legacy.startDate||dueDate.slice(0,10),'00:00'),dueDate:withTime(dueDate,'23:59')}}),
  events:data.events.map(event=>({...event,category:event.category==='实验室'?'工作':event.category==='学校'?'组织':event.category}))});

export function sampleData(): WorkbenchData {
  const me='person-me',lead='person-lead',partner='person-partner',client='person-client';
  const p1='project-product',p2='project-event',m1='milestone-prototype',m2='milestone-plan';
  return {
    projects:[
      {id:p1,name:'产品迭代',description:'整理反馈并完成下一版本的核心改进。',status:'进行中',priority:'高',startDate:isoTime(-30,9),endDate:isoTime(45,18),tags:['产品','重点'],notes:'每周回顾一次进度。'},
      {id:p2,name:'年度活动',description:'协调场地、内容与参与人员。',status:'规划中',priority:'中',startDate:isoTime(-7,10),endDate:isoTime(75,17),tags:['活动'],notes:''},
    ],
    milestones:[
      {id:m1,projectId:p1,name:'完成可用原型',targetDate:iso(5),status:'进行中'},
      {id:m2,projectId:p2,name:'确认执行方案',targetDate:iso(9),status:'未开始'},
    ],
    tasks:[
      {id:'task-1',milestoneId:m1,projectId:p1,title:'整理用户反馈',startDate:isoTime(0,9),dueDate:isoTime(0,23,59),completed:false,weight:2,priority:'高',notes:''},
      {id:'task-2',milestoneId:m1,projectId:p1,title:'确认交互细节',startDate:isoTime(1,10),dueDate:isoTime(2,18),completed:true,weight:1,priority:'中',notes:''},
      {id:'task-3',milestoneId:m2,projectId:p2,title:'准备活动预算',startDate:isoTime(5,9),dueDate:isoTime(6,17),completed:false,weight:1,priority:'中',notes:''},
    ],
    persons:[
      {id:me,name:'Alex',role:'负责人',organization:'项目组',contact:'',tags:['我'],notes:'关系图谱的中心人物',importantDate:'',isSelf:true},
      {id:lead,name:'林然',role:'同事',organization:'产品团队',contact:'',tags:['核心成员'],notes:'负责产品规划',importantDate:'',isSelf:false},
      {id:partner,name:'周宁',role:'合作伙伴',organization:'设计团队',contact:'',tags:['设计'],notes:'负责体验设计',importantDate:'',isSelf:false},
      {id:client,name:'顾言',role:'客户',organization:'合作机构',contact:'',tags:['重要联系人'],notes:'主要需求沟通人',importantDate:'',isSelf:false},
    ],
    relationships:[
      {id:'rel-1',personAId:me,personBId:lead,scores:{trust:4,collaboration:5,familiarity:4,influence:4},notes:'长期协作',events:[]},
      {id:'rel-2',personAId:me,personBId:partner,scores:{trust:3,collaboration:4,familiarity:3,influence:2},notes:'项目合作',events:[]},
      {id:'rel-3',personAId:lead,personBId:client,scores:{trust:2,collaboration:3,familiarity:2,influence:3},notes:'需求对接',events:[]},
      {id:'rel-4',personAId:partner,personBId:client,scores:{trust:2,collaboration:2,familiarity:1,influence:2},notes:'方案沟通',events:[]},
    ],
    events:[
      {id:'event-1',title:'完成首轮需求评审',date:iso(-1),category:'工作',importance:'重要',details:'已确认优先级与下一步安排。',tags:['评审'],referenceUrl:'',projectIds:[p1],personIds:[me,lead],relationshipIds:['rel-1']},
      {id:'event-2',title:'年度活动场地确认',date:iso(-3),category:'组织',importance:'普通',details:'场地档期已预留。',tags:['活动'],referenceUrl:'',projectIds:[p2],personIds:[partner],relationshipIds:[]},
    ],
    settings:{recentDays:7,ownerName:'Alex'},
  };
}

export async function loadData(): Promise<WorkbenchData> {
  const persons = await db.persons.toArray();
  if (!persons.length) { const seed = sampleData(); await replaceData(seed); return seed; }
  const settingsRow = await db.settings.get('main');
  return normalizeData({ projects:await db.projects.toArray(), milestones:await db.milestones.toArray(), tasks:await db.tasks.toArray(), persons, relationships:await db.relationships.toArray(), events:await db.events.toArray(), settings:settingsRow ? {recentDays:settingsRow.recentDays,ownerName:settingsRow.ownerName} : {recentDays:7,ownerName:'我'} });
}

export async function replaceData(data: WorkbenchData) {
  data=normalizeData(data);
  await db.transaction('rw', [db.projects,db.milestones,db.tasks,db.persons,db.relationships,db.events,db.settings], async () => {
    await Promise.all([db.projects.clear(),db.milestones.clear(),db.tasks.clear(),db.persons.clear(),db.relationships.clear(),db.events.clear(),db.settings.clear()]);
    await Promise.all([db.projects.bulkAdd(data.projects),db.milestones.bulkAdd(data.milestones),db.tasks.bulkAdd(data.tasks),db.persons.bulkAdd(data.persons),db.relationships.bulkAdd(data.relationships),db.events.bulkAdd(data.events),db.settings.add({...data.settings,id:'main'})]);
  });
}

export function makeBackup(data: WorkbenchData): BackupPayload { return { schemaVersion:1, exportedAt:new Date().toISOString(), ...data }; }
export function validateBackup(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false;
  const x = value as Partial<BackupPayload>;
  if (x.schemaVersion !== 1 || !Array.isArray(x.projects) || !Array.isArray(x.milestones) || !Array.isArray(x.tasks) || !Array.isArray(x.persons) || !Array.isArray(x.relationships) || !Array.isArray(x.events) || !x.settings) return false;
  const hasIds=(rows:unknown[])=>rows.every(row=>!!row&&typeof row==='object'&&typeof (row as {id?:unknown}).id==='string');
  const settings=x.settings as Partial<Settings>;
  return hasIds(x.projects)&&hasIds(x.milestones)&&hasIds(x.tasks)&&hasIds(x.persons)&&hasIds(x.relationships)&&hasIds(x.events)
    && x.persons.filter(p=>(p as Person).isSelf).length===1
    && typeof settings.ownerName==='string'&&typeof settings.recentDays==='number';
}
