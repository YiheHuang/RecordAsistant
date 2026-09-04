export type ProjectStatus = '规划中' | '进行中' | '暂停' | '已完成' | '归档';
export type Priority = '高' | '中' | '低';
export type EventCategory = '工作' | '组织' | '会议' | '行政' | '人际' | '其他' | '实验室' | '学校';
export type Importance = '重要' | '普通' | '参考';

export interface Project {
  id: string; name: string; description: string; status: ProjectStatus; priority: Priority;
  startDate: string; endDate: string; tags: string[]; notes: string;
}
export interface Milestone { id: string; projectId: string; name: string; targetDate: string; status: '未开始' | '进行中' | '已完成'; }
export interface Task { id: string; milestoneId: string; projectId: string; title: string; dueDate: string; completed: boolean; weight: number; priority: Priority; notes: string; }
export interface Person { id: string; name: string; role: string; organization: string; contact: string; tags: string[]; notes: string; importantDate: string; isSelf: boolean; }
export interface ScoreSet { trust: number; collaboration: number; familiarity: number; influence: number; }
export interface RelationshipEvent { id: string; date: string; type: string; description: string; projectId?: string; before: ScoreSet; after: ScoreSet; }
export interface Relationship { id: string; personAId: string; personBId: string; scores: ScoreSet; notes: string; events: RelationshipEvent[]; }
export interface WorkbenchEvent { id: string; title: string; date: string; category: EventCategory; importance: Importance; details: string; tags: string[]; referenceUrl: string; projectIds: string[]; personIds: string[]; relationshipIds: string[]; sourceRelationshipEventId?: string; }
export interface Settings { recentDays: number; ownerName: string; }
export interface WorkbenchData { projects: Project[]; milestones: Milestone[]; tasks: Task[]; persons: Person[]; relationships: Relationship[]; events: WorkbenchEvent[]; settings: Settings; }
export interface BackupPayload extends WorkbenchData { schemaVersion: 1; exportedAt: string; }
