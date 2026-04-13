import { create } from 'zustand';
import { Subject } from '../models/Subject';

interface SubjectState {
    subjects: Subject[]; // Personal
    systemSubjects: Subject[]; // Educational system
    classes: any[]; // Grades
    isLoading: boolean;

    // Actions
    setSubjects: (subjects: Subject[]) => void;
    setSystemSubjects: (subjects: Subject[]) => void;
    setClasses: (classes: any[]) => void;
    addSubject: (subject: Subject) => void;
    updateSubject: (updated: Subject) => void;
    deleteSubject: (id: string) => void;
    setLoading: (loading: boolean) => void;
    clearData: () => void;
}

export const useSubjectStore = create<SubjectState>((set) => ({
    subjects: [],
    systemSubjects: [],
    classes: [],
    isLoading: false,

    setSubjects: (subjects) => set({ subjects }),
    setSystemSubjects: (systemSubjects) => set({ systemSubjects }),
    setClasses: (classes) => set({ classes }),

    addSubject: (subject) => set((state) => ({
        subjects: [...state.subjects, subject]
    })),

    updateSubject: (updated) => set((state) => ({
        subjects: state.subjects.map(s => s.id === updated.id ? updated : s)
    })),

    deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id)
    })),

    setLoading: (loading) => set({ isLoading: loading }),

    clearData: () => set({ subjects: [], systemSubjects: [], classes: [] })
}));
