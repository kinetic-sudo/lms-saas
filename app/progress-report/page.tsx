// app/progress-report/page.tsx
import React from 'react'
import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserProgress, getQuizHistory } from '@/lib/action/quiz.action'
import ProgressReportClient from '@/components/ProgressReportClient'

const ProgressReport = async () => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect('/sign-in');

  // Fetch real data
  const progress = await getUserProgress('coding'); // or get from URL param
  const quizHistory = await getQuizHistory();

  return (
    <ProgressReportClient 
      progress={progress}
      quizHistory={quizHistory}
      userName={user.firstName || 'User'}
    />
  );
};

export default ProgressReport;