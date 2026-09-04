import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RecordAssistant',
  description: '项目、关系与事件的本地记录助手',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
