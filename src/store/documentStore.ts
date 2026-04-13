import { create } from 'zustand';
import { Document } from '../models/Document';

interface DocumentState {
    documents: Document[];
    isLoading: boolean;
    setDocuments: (documents: Document[]) => void;
    addDocument: (document: Document) => void;
    updateDocument: (updated: Document) => void;
    deleteDocument: (id: string) => void;
    setLoading: (loading: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
    documents: [],
    isLoading: false,

    setDocuments: (documents) => set({ documents }),

    addDocument: (document) => set((state) => ({
        documents: [document, ...state.documents]
    })),

    updateDocument: (updated) => set((state) => ({
        documents: state.documents.map(d => d.id === updated.id ? updated : d)
    })),

    deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter(d => d.id !== id)
    })),

    setLoading: (loading) => set({ isLoading: loading })
}));
