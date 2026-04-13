import { create } from 'zustand';
import { Exercise } from '../models/Exercise';

interface ExerciseState {
    exercisesBySubject: Record<string, Exercise[]>;
    currentExerciseDetail: Exercise | null;
    isLoading: boolean;
    setExercises: (subjectId: string, exercises: Exercise[]) => void;
    addExercise: (subjectId: string, exercise: Exercise) => void;
    updateExercise: (subjectId: string, updated: Exercise) => void;
    deleteExercise: (subjectId: string, id: string) => void;
    setCurrentExerciseDetail: (exercise: Exercise | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
    exercisesBySubject: {},
    currentExerciseDetail: null,
    isLoading: false,

    setExercises: (subjectId, data) => set((state) => ({
        exercisesBySubject: { ...state.exercisesBySubject, [subjectId]: data }
    })),
    addExercise: (subjectId, exercise) => set((state) => ({
        exercisesBySubject: {
            ...state.exercisesBySubject,
            [subjectId]: [exercise, ...(state.exercisesBySubject[subjectId] || [])]
        }
    })),
    updateExercise: (subjectId, updated) => set((state) => {
        const list = state.exercisesBySubject[subjectId] || [];
        return {
            exercisesBySubject: {
                ...state.exercisesBySubject,
                [subjectId]: list.map(e => e.id === updated.id ? updated : e)
            }
        };
    }),
    deleteExercise: (subjectId, id) => set((state) => {
        const list = state.exercisesBySubject[subjectId] || [];
        return {
            exercisesBySubject: {
                ...state.exercisesBySubject,
                [subjectId]: list.filter(e => e.id !== id)
            }
        };
    }),
    setCurrentExerciseDetail: (exercise) => set({ currentExerciseDetail: exercise }),
    setLoading: (loading) => set({ isLoading: loading })
}));
