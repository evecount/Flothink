import ProjectDetailClient from './ProjectDetailClient';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
