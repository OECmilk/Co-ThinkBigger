
'use client';

import { useState, use, useEffect } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectProvider, useProject } from '@/components/providers/ProjectProvider';
import { IoChatbubblesOutline } from "react-icons/io5";
import ChatDrawer from '@/components/chat/ChatDrawer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { ProblemCandidates } from '@/components/think-bigger/ProblemCandidates';
import { DeconstructionBoard } from '@/components/think-bigger/DeconstructionBoard';
import { DesireBoard } from '@/components/think-bigger/DesireBoard';
import { ChoiceMap } from '@/components/think-bigger/ChoiceMap';
import { CombinationTable } from '@/components/think-bigger/CombinationTable';

function ProjectWorkspace() {
  const { title, projectId, members, activeChat, openChat, closeChat } = useProject();
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const u = localStorage.getItem('currentUser');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    const openChatParam = searchParams.get('openChat');
    if (openChatParam === 'true') {
      openChat('project');
      window.history.replaceState({}, '', window.location.pathname);
    }
    const cid = searchParams.get('chatCandidateId');
    if (cid) {
      setCurrentStep(1);
    }
  }, [searchParams, openChat]);

  const steps = [
    { id: 1, name: '課題選定 (Step 1)', component: ProblemCandidates },
    { id: 2, name: '分解 (Step 2)', component: DeconstructionBoard },
    { id: 3, name: '望み (Step 3)', component: DesireBoard },
    { id: 4, name: '選択マップ (Step 4)', component: ChoiceMap },
    { id: 5, name: '結合と評価 (Step 5)', component: CombinationTable },
  ];

  const CurrentComponent = steps.find((s) => s.id === currentStep)?.component || ProblemCandidates;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header / Stepper */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{title || 'Loading...'}</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => activeChat?.type === 'project' ? closeChat() : openChat('project')}
            className={`p-2 rounded-full transition-colors mr-2 ${activeChat?.type === 'project' ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-orange-100 hover:text-orange-600'}`}
            title="Project Chat"
          >
            <IoChatbubblesOutline size={24} />
          </button>

          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentStep === step.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {step.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {currentStep === 1 ? (
            <ProblemCandidates onNext={handleNext} />
          ) : (
            <CurrentComponent />
          )}
        </div>
      </main>

      {projectId && currentUser && activeChat && (
        <ChatDrawer
          isOpen={true} // Controlled by activeChat existence
          onClose={closeChat}
          projectId={projectId}
          candidateId={activeChat.type === 'candidate' ? activeChat.id : undefined}
          title={activeChat.type === 'candidate'
            ? 'Chat - Candidate' // Ideally fetch candidate text, but simplified for now
            : title + " - Chat"}
          members={members}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(id === 'default');

  useEffect(() => {
    if (id === 'default') {
      const initDefault = async () => {
        try {
          // Retrieve user from local storage
          const userStr = localStorage.getItem('currentUser');
          if (!userStr) {
            router.replace('/login');
            return;
          }
          const user = JSON.parse(userStr);

          // Fetch projects
          const res = await fetch(`/api/projects?userId=${user.id}`);
          const data = await res.json();

          if (data.projects && data.projects.length > 0) {
            router.replace(`/projects/${data.projects[0].id}`);
          } else {
            // Create new
            const createRes = await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, title: 'My Project' })
            });
            const newData = await createRes.json();
            router.replace(`/projects/${newData.project.id}`);
          }
        } catch (e) {
          console.error(e);
          setLoading(false); // Fallback to avoid infinite empty loading
        }
      };
      initDefault();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ProjectProvider initialProjectId={id}>
      <ProjectWorkspace />
    </ProjectProvider>
  );
}
