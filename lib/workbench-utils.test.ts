import { describe, expect, it } from 'vitest';
import { makeBackup, sampleData, validateBackup } from './workbench-data';
import { milestoneProgress, projectProgress, stripLinksForDeleted } from './workbench-utils';

describe('项目进度计算', () => {
  it('按照任务权重汇总项目与里程碑进度', () => {
    const data=sampleData();
    expect(projectProgress('project-product',data.tasks)).toBe(33);
    expect(milestoneProgress('milestone-prototype',data.tasks)).toBe(33);
  });
  it('没有任务时返回零进度',()=>expect(projectProgress('missing',[])).toBe(0));
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
