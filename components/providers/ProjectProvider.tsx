'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Domain Types
export interface Choice {
  id: string;
  text: string;
  description?: string;
  isOutsideDomain: boolean;
  source?: string; // Where did this idea come from?
}

export interface SubProblem {
  id: string;
  title: string;
  choices: Choice[];
  searchQueries: { type: 'general' | 'partial' | 'parallel'; query: string }[];
}

export interface ProjectState {
  projectId: string | null;
  title: string;
  problemStatement: string;
  subProblems: SubProblem[];
  selectedCombination: Record<string, string>; // subProblemId -> choiceId

  // New: Collaborative Problem Selection
  candidates: ProblemCandidate[];
  desires: Desire[];
  savedIdeas: SavedIdea[];

  // Members for Chat
  members: { id: string; name: string; avatar: string | null }[];
}

export type DesireCategory = 'self' | 'target' | 'third-party';

export interface Desire {
  id: string;
  text: string;
  category: DesireCategory;
}

export interface SavedIdea {
  id: string;
  title: string;
  combination: Record<string, string>; // subProblemId -> choiceId
  ratings: Record<string, number>; // desireId -> rating (0-10 or 0-5)
}

export interface ProblemCandidate {
  id: string;
  text: string;
  reactions: Record<string, number>; // userId -> passion level (1-5)
}

interface ProjectContextType extends ProjectState {
  setProblemStatement: (statement: string) => void;
  addSubProblem: (title: string) => void;
  updateSubProblem: (id: string, title: string) => void;
  removeSubProblem: (id: string) => void;
  addChoice: (subProblemId: string, choiceJson: Omit<Choice, 'id'>) => void;
  removeChoice: (subProblemId: string, choiceId: string) => void;
  selectChoice: (subProblemId: string, choiceId: string) => void;

  // New methods
  addCandidate: (text: string) => void;
  removeCandidate: (id: string) => void;
  updateReaction: (candidateId: string, userId: string, passion: number) => void;

  // Desire methods
  addDesire: (text: string, category: DesireCategory) => void;
  removeDesire: (id: string) => void;
  updateDesire: (id: string, text: string) => void;

  // Idea methods
  saveIdea: (title: string, combination: Record<string, string>) => void;
  rateIdea: (ideaId: string, desireId: string, value: number) => void;

  addSearchQuery: (subProblemId: string, type: 'general' | 'partial' | 'parallel', query: string) => void;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export function ProjectProvider({ children, initialProjectId }: { children: ReactNode; initialProjectId?: string }) {
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [subProblems, setSubProblems] = useState<SubProblem[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<Record<string, string>>({});
  const [candidates, setCandidates] = useState<ProblemCandidate[]>([]);
  const [desires, setDesires] = useState<Desire[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string; avatar: string | null }[]>([]);

  // Initial Load from DB (Simulated for default project for now if no ID)
  // In real app, we get ID from URL or list

  const loadProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/sync`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const p = data.project;

      setProjectId(p.id);
      setTitle(p.title || 'Untitled Project');
      setProblemStatement(p.problemStatement || '');
      setSubProblems(p.subProblems || []);
      setCandidates(p.candidates || []);
      setDesires(p.desires || []);
      setSavedIdeas(p.savedIdeas || []);

      // Combine owner and members
      const allMembers = [];
      if (p.owner) allMembers.push(p.owner);
      if (p.members) allMembers.push(...p.members);
      // Remove duplicates just in case
      const uniqueMembers = Array.from(new Map(allMembers.map(m => [m.id, m])).values());
      setMembers(uniqueMembers);

    } catch (e) {
      console.error("Load error", e);
    }
  };

  // Initial load effect
  useEffect(() => {
    if (initialProjectId) {
      loadProject(initialProjectId);
    }
  }, [initialProjectId]);

  const saveProject = async () => {
    if (!projectId) return;
    try {
      await fetch(`/api/projects/${projectId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement,
          subProblems,
          candidates,
          desires,
          savedIdeas
        })
      });
    } catch (e) {
      console.error("Save error", e);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (!projectId) return;

    const saveData = async () => {
      console.log('Auto-saving...');
      try {
        await fetch(`/api/projects/${projectId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemStatement,
            subProblems,
            candidates,
            desires,
            savedIdeas
          })
        });
        console.log('Saved');
      } catch (e) {
        console.error("Save error", e);
      }
    };

    const timer = setTimeout(saveData, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [projectId, problemStatement, subProblems, candidates, desires, savedIdeas]);


  const addSubProblem = (title: string) => {
    setSubProblems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title, choices: [], searchQueries: [] },
    ]);
  };

  const updateSubProblem = (id: string, title: string) => {
    setSubProblems(prev => prev.map(sp => sp.id === id ? { ...sp, title } : sp));
  }

  const removeSubProblem = (id: string) => {
    setSubProblems((prev) => prev.filter((sp) => sp.id !== id));
    // Also remove any selections for this sub-problem
    const newCombo = { ...selectedCombination };
    delete newCombo[id];
    setSelectedCombination(newCombo);
  };

  const addChoice = (subProblemId: string, choiceData: Omit<Choice, 'id'>) => {
    setSubProblems((prev) =>
      prev.map((sp) => {
        if (sp.id !== subProblemId) return sp;
        return {
          ...sp,
          choices: [...sp.choices, { ...choiceData, id: crypto.randomUUID() }],
        };
      })
    );
  };

  const removeChoice = (subProblemId: string, choiceId: string) => {
    setSubProblems(prev => prev.map(sp => {
      if (sp.id !== subProblemId) return sp;
      return {
        ...sp,
        choices: sp.choices.filter(c => c.id !== choiceId)
      }
    }))
  }

  const selectChoice = (subProblemId: string, choiceId: string) => {
    setSelectedCombination((prev) => ({
      ...prev,
      [subProblemId]: choiceId,
    }));
  };

  // Candidate methods
  const addCandidate = (text: string) => {
    setCandidates(prev => [...prev, {
      id: crypto.randomUUID(),
      text,
      reactions: {}
    }]);
  };

  const removeCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  const updateReaction = (candidateId: string, userId: string, passion: number) => {
    setCandidates(prev => prev.map(c => {
      if (c.id !== candidateId) return c;
      const newReactions = { ...c.reactions };

      // Toggle logic
      if (newReactions[userId] === passion) {
        delete newReactions[userId];
      } else {
        newReactions[userId] = passion;
      }

      return { ...c, reactions: newReactions };
    }));
  };

  // Desire methods
  const addDesire = (text: string, category: DesireCategory) => {
    setDesires(prev => [...prev, { id: crypto.randomUUID(), text, category }]);
  };

  const removeDesire = (id: string) => {
    setDesires(prev => prev.filter(d => d.id !== id));
  };

  const updateDesire = (id: string, text: string) => {
    setDesires(prev => prev.map(d => d.id === id ? { ...d, text } : d));
  }

  const addSearchQuery = (subProblemId: string, type: 'general' | 'partial' | 'parallel', query: string) => {
    setSubProblems(prev => prev.map(sp => {
      if (sp.id !== subProblemId) return sp;
      return {
        ...sp,
        searchQueries: [...sp.searchQueries, { type, query }]
      };
    }));
  }

  // Idea methods
  const saveIdea = (title: string, combination: Record<string, string>) => {
    setSavedIdeas(prev => [...prev, {
      id: crypto.randomUUID(),
      title,
      combination,
      ratings: {}
    }]);
  };

  const rateIdea = (ideaId: string, desireId: string, value: number) => {
    setSavedIdeas(prev => prev.map(idea => {
      if (idea.id !== ideaId) return idea;
      return {
        ...idea,
        ratings: { ...idea.ratings, [desireId]: value }
      };
    }));
  };

  const value = {
    projectId,
    title,
    problemStatement,
    subProblems,
    selectedCombination,
    candidates,
    desires,
    savedIdeas,
    members,
    setProblemStatement,
    addSubProblem,
    updateSubProblem,
    removeSubProblem,
    addChoice,
    removeChoice,
    selectChoice,
    addCandidate,
    removeCandidate,
    updateReaction,
    addDesire,
    removeDesire,
    updateDesire,

    addSearchQuery,
    saveIdea,
    rateIdea,
    // Expose load/save if needed
    loadProject,
    saveProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}
