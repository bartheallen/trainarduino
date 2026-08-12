import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourseContent } from '@/lib/repositories/learningRepository';
import { LessonReader } from '@/components/lesson/LessonReader';

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const user = await getCurrentUser('lesson');
  if (!user) {
    redirect('/login');
  }

  const { id, lessonId } = await params;
  const moduleId = Number(id);
  const lessonIdentifier = Number(lessonId);

  if (Number.isNaN(moduleId) || Number.isNaN(lessonIdentifier)) {
    redirect('/');
  }

  const content = await getCourseContent(moduleId);
  const lesson = content.lessons.find((entry) => entry.id === lessonIdentifier) ?? content.lessons[0];

  if (!lesson) {
    redirect('/');
  }

  return <LessonReader module={content.module} lesson={lesson} lessons={content.lessons} currentUserId={user.id} />;
}
