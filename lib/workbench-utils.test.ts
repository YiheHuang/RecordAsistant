import { describe, expect, it } from 'vitest';
import { makeBackup, normalizeData, sampleData, validateBackup } from './workbench-data';
import { milestoneProgress, nextMidnightAfter, nextWholeHour, projectProgress, stripLinksForDeleted } from './workbench-utils';
import type { WorkbenchData } from './workbench-types';

describe('项目进度计算', () => {
  it('按照任务权重汇总项目与里程碑进度', () => {
    const data=sampleData();
    expect(projectProgress('project-product',data.tasks)).toBe(33);
    expect(milestoneProgress('milestone-prototype',data.tasks)).toBe(33);
  });
  it('没有任务时返回零进度',()=>expect(projectProgress('missing',[])).toBe(0));
});

describe('小时级时间',()=>{
  it('默认从下一个整点开始，并在其后的午夜截止',()=>{
    const start=nextWholeHour(new Date(2026,8,7,10,23));
    expect(start).toBe('2026-09-07T11:00');
    expect(nextMidnightAfter(start)).toBe('2026-09-08T00:00');
  });
  it('临近午夜时将截止时间顺延到开始时间之后的午夜',()=>{
    const start=nextWholeHour(new Date(2026,8,7,23,30));
    expect(start).toBe('2026-09-08T00:00');
    expect(nextMidnightAfter(start)).toBe('2026-09-09T00:00');
  });
  it('为旧版日期数据补充时间并保留原截止日期语义',()=>{
    const data=sampleData();
    const legacy={...data,projects:data.projects.map((p,i)=>i? p:{...p,startDate:'2026-09-01',endDate:'2026-09-30'}),tasks:data.tasks.map((t,i)=>i?t:({...t,startDate:undefined,dueDate:'2026-09-07'}))} as unknown as WorkbenchData;
    const normalized=normalizeData(legacy);
    expect(normalized.projects[0].startDate).toBe('2026-09-01T00:00');
    expect(normalized.projects[0].endDate).toBe('2026-09-30T23:59');
    expect(normalized.tasks[0].startDate).toBe('2026-09-07T00:00');
    expect(normalized.tasks[0].dueDate).toBe('2026-09-07T23:59');
  });
});

describe('删除关联对象',()=>{
  it('删除项目时保留事件正文并移除关联',()=>{
    const data=sampleData(); const next=stripLinksForDeleted(data,'project','project-product');
    expect(next.projects.some(p=>p.id==='project-product')).toBe(false);
    expect(next.events.find(e=>e.id==='event-1')?.title).toBe('完成首轮需求评审');
    expect(next.events.find(e=>e.id==='event-1')?.projectIds).toEqual([]);
  });
  it('删除人物时同步删除相连关系',()=>{
    const next=stripLinksForDeleted(sampleData(),'person','person-lead');
    expect(next.relationships.some(r=>r.personAId==='person-lead'||r.personBId==='person-lead')).toBe(false);
    expect(next.events.every(e=>!e.personIds.includes('person-lead'))).toBe(true);
  });
});

describe('备份校验',()=>{
  it('接受完整的当前版本备份',()=>expect(validateBackup(makeBackup(sampleData()))).toBe(true));
  it('拒绝损坏、版本错误或多核心人物的数据',()=>{
    expect(validateBackup({schemaVersion:1})).toBe(false);
    expect(validateBackup({...makeBackup(sampleData()),schemaVersion:2})).toBe(false);
    const backup=makeBackup(sampleData()); backup.persons[1].isSelf=true;
    expect(validateBackup(backup)).toBe(false);
  });
});
